import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { technicianApi, type ApiRequest } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

type MeState = 'loading' | 'registered' | 'not_registered'

interface Coords {
  lat: number
  lng: number
}

export default function TechnicianRequests() {
  const { user } = useAuth()
  const [rows, setRows] = useState<ApiRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<any>(null)
  const [meState, setMeState] = useState<MeState>('loading')
  const [accepting, setAccepting] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  // Location state
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(true)

  // Fetch technician profile
  useEffect(() => {
    if (!user) {
      setMeState('not_registered')
      return
    }
    setMeState('loading')
    technicianApi
      .me(user.userId)
      .then((row) => {
        setMe(row)
        setMeState('registered')
      })
      .catch(() => {
        setMe(null)
        setMeState('not_registered')
      })
  }, [user?.userId])

  // Location on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Location not supported by this browser.')
      setLocating(false)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationError(null)
        setLocating(false)
      },
      (err) => {
        setCoords(null)
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable it to accept jobs.'
            : 'Could not read your GPS position. Try again.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }, [])

  // Instant fetching with fast polling (every 3 seconds)
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchRequests = async () => {
      try {
        const data = await technicianApi.availableRequests()
        if (!cancelled) {
          setRows(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('[TechnicianRequests] fetch failed:', err)
      }
    }

    // Fetch immediately
    fetchRequests()

    // Poll every 3 seconds for instant updates
    const intervalId = setInterval(fetchRequests, 3000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [user?.userId])

  const retryLocation = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Permission denied. Open browser settings and allow location.'
            : 'Could not read your GPS position. Try again.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const accept = async (id: string) => {
    if (!user) {
      setModal({ open: true, type: 'error', title: 'Not signed in', message: 'Please sign in again.' })
      return
    }
    if (meState !== 'registered' || !me) {
      setModal({ open: true, type: 'error', title: 'Not registered', message: 'Submit the technician form first.' })
      return
    }
    if (!coords) {
      setModal({ open: true, type: 'error', title: 'Location not available', message: 'Enable location so the customer can track you.' })
      return
    }

    setAccepting(id)
    try {
      await technicianApi.acceptRequest(id, me.id, me.fullName, me.phone || '', coords.lat, coords.lng)
      setRows((prev) => prev.filter((r) => r.id !== id))
      setModal({
        open: true,
        type: 'success',
        title: 'Job accepted',
        message: 'The request has been assigned to you. Your location and contact have been shared with the customer.',
      })
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Could not accept',
        message: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setAccepting(null)
    }
  }

  const stats = useMemo(() => {
    const total = rows.length
    const avgDistance = total > 0 ? rows.reduce((s, r) => s + (r.distance || 0), 0) / total : 0
    const totalValue = rows.reduce((s, r) => s + (r.estimatedCost || 0), 0)
    return { total, avgDistance, totalValue }
  }, [rows])

  const locationBadge = () => {
    if (locating) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          <Loader2 size={12} className="animate-spin" /> Getting location
        </div>
      )
    }
    if (coords) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
          <MapPin size={12} /> Location ready
        </div>
      )
    }
    return (
      <button
        onClick={retryLocation}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 transition-colors"
      >
        <AlertTriangle size={12} /> Enable location
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Available Requests</h1>
          <p className="text-slate-500 mt-1">
            Every pending vehicle-problem request, updating automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {locationBadge()}
        </div>
      </div>

      {locationError && (
        <Card className="p-4 border-l-4 border-l-red-400">
          <p className="text-sm text-red-700">{locationError}</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Open requests</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Avg distance</p>
          <p className="text-2xl font-bold text-slate-900">
            {stats.avgDistance.toFixed(1)} km
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total value</p>
          <p className="text-2xl font-bold text-slate-900">
            {stats.totalValue.toLocaleString()} TZS
          </p>
        </Card>
      </div>

      {meState === 'not_registered' && (
        <Card className="p-5 border-l-4 border-l-yellow-400">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                You are not registered as a technician yet
              </p>
              <p className="text-sm text-slate-600 mt-1">
                You can watch this list, but you must submit the technician application before you can accept jobs.
              </p>
              <Link
                to="/technician/register"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-600 hover:underline"
              >
                Become a Technician
              </Link>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Fetching requests
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            No pending requests right now. New customer requests will appear here automatically.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const canAccept = !locating && !!coords
            const isBusy = accepting === r.id
            return (
              <Card key={r.id} className="p-5" hover>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge color="yellow">New</Badge>
                      <span className="text-xs text-slate-400">#{r.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-900">{r.problemType}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {r.vehicleName} {r.vehicleModel} • {r.plateNumber}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                      {r.problemDescription}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {r.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {r.distance} km away
                      </span>
                      {r.customerName && (
                        <span className="text-slate-400">by {r.customerName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex lg:flex-col gap-2 lg:items-end">
                    <div className="text-right mb-2">
                      <p className="text-xs text-slate-500">Estimated</p>
                      <p className="text-xl font-bold text-brand-600">
                        {(r.estimatedCost || 0).toLocaleString()} TZS
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => accept(r.id)}
                      disabled={isBusy || !canAccept}
                      title={!canAccept ? 'Waiting for your location' : 'Accept'}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Accepting
                        </>
                      ) : !canAccept ? (
                        <>
                          <MapPin size={14} /> Enable location
                        </>
                      ) : (
                        <>
                          <Check size={14} /> Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                modal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {modal.type === 'success' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">{modal.message}</p>
          </div>
          <div className="flex justify-end">
            <Button
              variant={modal.type === 'success' ? 'primary' : 'outline'}
              onClick={() => setModal({ ...modal, open: false })}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}