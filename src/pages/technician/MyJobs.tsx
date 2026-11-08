import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Car,
} from 'lucide-react'
import { technicianApi, type ApiRequest } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import LiveLocationModal from '../../components/LiveLocationModal'

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

const statusColor = (s: string): 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray' => {
  if (s === 'pending') return 'yellow'
  if (s === 'taken') return 'blue'
  if (s === 'processing') return 'purple'
  if (s === 'paid') return 'green'
  if (s === 'cancelled') return 'red'
  return 'gray'
}

export default function MyJobs() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [me, setMe] = useState<any>(null)
  const [jobs, setJobs] = useState<ApiRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [mapTarget, setMapTarget] = useState<ApiRequest | null>(null)
  const [modal, setModal] = useState<ModalState>({
    open: false, type: 'success', title: '', message: '',
  })

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const tech = await technicianApi.me(user.userId).catch(() => null)
      setMe(tech)
      if (tech) {
        const rows = await technicianApi.myJobs(tech.id)
        setJobs(rows)
      } else {
        setJobs([])
      }
    } catch (e) {
      setModal({
        open: true, type: 'error', title: 'Could not load jobs',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.userId])

  const active = jobs.filter((j) => ['taken', 'processing'].includes(j.status))
  const completed = jobs.filter((j) => j.status === 'paid')

  const startJob = async (id: string) => {
    try {
      const { adminApi } = await import('../../lib/api')
      await adminApi.updateRequest(id, { status: 'processing' })
      load()
    } catch (e) {
      setModal({
        open: true, type: 'error', title: 'Could not start job',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    }
  }

  const markPaid = async (id: string) => {
    try {
      const { adminApi } = await import('../../lib/api')
      await adminApi.updateRequest(id, { status: 'paid' })
      load()
    } catch (e) {
      setModal({
        open: true, type: 'error', title: 'Could not mark as paid',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    }
  }

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">Please sign in.</p>
      </Card>
    )
  }

  if (!loading && !me) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-700 font-semibold mb-2">Not a registered technician</p>
        <p className="text-sm text-slate-500 mb-4">
          Submit the technician application to accept and manage jobs.
        </p>
        <Button onClick={() => nav('/technician/register')}>Become a Technician</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-slate-500 mt-1">
          Requests you have accepted. Track location, chat, and manage payment.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-slate-900">{active.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading jobs
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No jobs yet. Accept a request to see it here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <Card key={j.id} className="p-5" hover>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge color={statusColor(j.status)}>{j.status}</Badge>
                    <span className="text-xs text-slate-400">#{j.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{j.problemType}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {j.vehicleName} {j.vehicleModel} • {j.plateNumber}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {j.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {j.distance} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {j.customerPhone}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[180px]">
                  <p className="text-lg font-bold text-slate-900">
                    {(j.estimatedCost || 0).toLocaleString()} TZS
                  </p>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button size="sm" variant="outline" onClick={() => setMapTarget(j)}>
                      <MapPin size={14} /> Track Customer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => nav(`/chat/${j.id}`)}
                    >
                      <MessageCircle size={14} /> Chat
                    </Button>
                    {j.status === 'taken' && (
                      <Button size="sm" variant="primary" onClick={() => startJob(j.id)}>
                        <Car size={14} /> Start Job
                      </Button>
                    )}
                    {j.status === 'processing' && (
                      <Button size="sm" variant="primary" onClick={() => markPaid(j.id)}>
                        <CheckCircle2 size={14} /> Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LiveLocationModal
        requestId={mapTarget?.id || null}
        customerName={mapTarget?.customerName || ''}
        onClose={() => setMapTarget(null)}
      />

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