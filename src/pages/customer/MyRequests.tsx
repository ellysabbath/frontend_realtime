import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Eye,
  XCircle,
  RotateCcw,
  Phone,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  MessageCircle,
  Navigation,
  Car,
} from 'lucide-react'
import { customerApi, type ApiRequest } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CustomerLocationTracker from '../../components/CustomerLocationTracker'
import LiveLocationModal from '../../components/LiveLocationModal'
import CallModal from '../../components/CallModal' // <-- ADDED IMPORT

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

const statusColor = (s: string) => {
  const map: Record<string, 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray'> = {
    pending: 'yellow',
    taken: 'blue',
    processing: 'purple',
    paid: 'green',
    cancelled: 'red',
  }
  return map[s] || 'gray'
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

type LiveState = 'connecting' | 'live' | 'polling'

export default function MyRequests() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState<ApiRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [liveState, setLiveState] = useState<LiveState>('connecting')
  
  const [selected, setSelected] = useState<ApiRequest | null>(null)
  const [trackingRequest, setTrackingRequest] = useState<ApiRequest | null>(null)
  const [callTarget, setCallTarget] = useState<ApiRequest | null>(null) // <-- ADDED STATE FOR CALLS
  
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const sourceRef = useRef<EventSource | null>(null)
  const pollTimerRef = useRef<number | null>(null)

  // ── 1. Initial load ──
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    customerApi
      .listRequests(user.userId)
      .then((rows) => {
        if (!cancelled) setRequests(rows)
      })
      .catch((e) => console.error('[MyRequests] initial load failed:', e))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.userId])

  // ── 2. Live stream + polling fallback ──
  useEffect(() => {
    if (!user) return

    const url = `${API_BASE}/customer/stream/?customerId=${encodeURIComponent(user.userId)}`
    let opened = false
    let dead = false

    const es = new EventSource(url)
    sourceRef.current = es

    const openTimeout = window.setTimeout(() => {
      if (!opened && !dead) {
        setLiveState('polling')
        startPolling()
      }
    }, 5000)

    es.addEventListener('open', () => {
      opened = true
      window.clearTimeout(openTimeout)
      setLiveState('live')
      stopPolling()
    })

    es.addEventListener('requests', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { requests: ApiRequest[] }
        setRequests(data.requests || [])
        setLoading(false)
      } catch (err) {
        console.error('[MyRequests] parse error:', err)
      }
    })

    es.onerror = () => {
      if (dead) return
      if (liveState !== 'polling') setLiveState('connecting')
    }

    function startPolling() {
      if (pollTimerRef.current !== null) return
      const tick = () => {
        customerApi
          .listRequests(user!.userId)
          .then(setRequests)
          .catch(() => {})
      }
      tick()
      pollTimerRef.current = window.setInterval(tick, 5000)
    }

    function stopPolling() {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    return () => {
      dead = true
      window.clearTimeout(openTimeout)
      es.close()
      sourceRef.current = null
      stopPolling()
    }
  }, [user?.userId])

  const stats = useMemo(() => {
    const active = requests.filter((r) =>
      ['pending', 'taken', 'processing'].includes(r.status),
    ).length
    const completed = requests.filter((r) => r.status === 'paid').length
    return { active, completed, total: requests.length }
  }, [requests])

  const cancel = async (id: string) => {
    setCancelling(id)
    try {
      await customerApi.cancelRequest(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      setModal({
        open: true,
        type: 'success',
        title: 'Request cancelled',
        message: 'Your request has been cancelled. You can re-order it any time.',
      })
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Could not cancel',
        message:
          e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setCancelling(null)
    }
  }

  const badge = () => {
    if (liveState === 'live') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
          Live
        </div>
      )
    }
    if (liveState === 'polling') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200">
          <Wifi size={12} />
          Polling
        </div>
      )
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200">
        <WifiOff size={12} />
        Connecting
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-slate-500 mt-1">
            Track and manage all your vehicle service requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {badge()}
          <Button onClick={() => nav('/customer/request/new')}>New Request</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading requests
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">You have not made any requests yet.</p>
          <Button className="mt-4" onClick={() => nav('/customer/request/new')}>
            Create your first request
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => (
            <div key={r.id}>
              <CustomerLocationTracker requestId={r.id} status={r.status} />

              <Card className="p-5" hover>
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  
                  {r.vehiclePhoto ? (
                    <div className="w-full lg:w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={r.vehiclePhoto} alt="Vehicle" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full lg:w-32 h-32 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <Car size={24} className="mb-1" />
                      <span className="text-[10px] uppercase font-semibold">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge color={statusColor(r.status)}>{r.status}</Badge>
                      <span className="text-xs text-slate-400">#{r.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-900">{r.problemType}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {r.vehicleName} {r.vehicleModel} • {r.plateNumber}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {r.location}
                      </span>
                      <span>{r.distance} km</span>
                      {r.technicianName && (
                        <span className="text-brand-600 font-semibold">
                          Tech: {r.technicianName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:flex-col lg:items-end shrink-0 lg:ml-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Estimated</p>
                      <p className="text-lg font-bold text-slate-900">
                        {(r.estimatedCost || 0).toLocaleString()} TZS
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {r.technicianName && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                            <Eye size={14} /> View Tech
                          </Button>
                          <Button size="sm" variant="outline" className="text-brand-600 border-brand-200 bg-brand-50 hover:bg-brand-100" onClick={() => setTrackingRequest(r)}>
                            <Navigation size={14} /> Track Live
                          </Button>
                          
                          {/* CALL BUTTON */}
                          <Button size="sm" variant="outline" onClick={() => setCallTarget(r)}>
                            <Phone size={14} /> Call
                          </Button>

                          <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white inline-flex items-center gap-1.5" onClick={() => nav(`/chat/${r.id}`)}>
                            <MessageCircle size={14} /> Chat
                          </Button>
                        </>
                      )}

                      {r.status === 'taken' && (
                        <Button size="sm" onClick={() => nav(`/customer/payment/${r.id}`)}>
                          <CreditCard size={14} /> Pay Now
                        </Button>
                      )}

                      {r.status === 'cancelled' ? (
                        <Button size="sm" variant="outline" onClick={() => nav('/customer/request/new')}>
                          <RotateCcw size={14} /> Re-order
                        </Button>
                      ) : r.status !== 'paid' ? (
                        <Button size="sm" variant="danger" onClick={() => cancel(r.id)} disabled={cancelling === r.id}>
                          {cancelling === r.id ? (
                            <><Loader2 size={14} className="animate-spin" /> Cancelling</>
                          ) : (
                            <><XCircle size={14} /> Cancel</>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Technician Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Technician Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xl">
                {selected.technicianName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900">{selected.technicianName || '—'}</p>
                <p className="text-sm text-slate-500">Verified Technician</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Phone size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.technicianPhone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.technicianLocation || '—'}</span>
              </div>
            </div>
            <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white inline-flex items-center justify-center gap-2" onClick={() => { const rid = selected.id; setSelected(null); nav(`/chat/${rid}`) }}>
              <MessageCircle size={16} /> Chat with technician
            </Button>
          </div>
        )}
      </Modal>

      {/* Live Tracking Modal */}
      <LiveLocationModal requestId={trackingRequest?.id || null} customerName={trackingRequest?.technicianName || 'Technician'} onClose={() => setTrackingRequest(null)} />

      {/* CALL MODAL (Customer calling Technician) */}
      {callTarget && (
        <CallModal
          roomId={callTarget.id}
          role="caller"
          currentUserId={user?.userId || ''}
          onClose={() => setCallTarget(null)}
        />
      )}

      {/* Feedback Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.title}>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${modal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {modal.type === 'success' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">{modal.message}</p>
          </div>
          <div className="flex justify-end">
            <Button variant={modal.type === 'success' ? 'primary' : 'outline'} onClick={() => setModal({ ...modal, open: false })}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}