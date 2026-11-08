import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ownerApi } from '../../lib/api'
import {
  Users,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  Wrench,
  Search,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

interface Technician {
  id: string
  userId: string
  fullName: string
  phone: string
  email: string
  city: string
  address: string
  garage: string
  experience: string
  status: string
  createdAt?: number
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function OwnerTech() {
  const { user } = useAuth()
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [selected, setSelected] = useState<Technician | null>(null)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const loadTechs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await ownerApi.garageTechnicians(user.userId)
      setTechs(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTechs()
  }, [user?.userId])

  const handleAction = async (tid: string, status: 'active' | 'rejected') => {
    setBusyId(tid)
    try {
      await ownerApi.approveTechnician(tid, status)
      await loadTechs()
      setSelected(null)
      setModal({
        open: true,
        type: 'success',
        title: status === 'active' ? 'Technician Approved' : 'Application Rejected',
        message:
          status === 'active'
            ? 'The technician has been approved and can now accept jobs.'
            : 'The technician application has been rejected.',
      })
    } catch (err: any) {
      setModal({
        open: true,
        type: 'error',
        title: 'Action failed',
        message: err.message || 'Something went wrong.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const filtered = techs.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false
    const q = search.toLowerCase()
    return (
      !q ||
      t.fullName?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.garage?.toLowerCase().includes(q)
    )
  })

  const fmtDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString() : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technician Applications</h1>
        <p className="text-slate-500 mt-1">
          Review technicians who applied to join your garages. You can approve or reject them, but not edit their data.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name, phone, or garage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'pending', 'active', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading technicians...
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Users size={40} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No technicians found</h3>
          <p className="text-slate-500">No applications match your search or filter.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((t) => {
            const isPending = t.status === 'pending'
            const isActive = t.status === 'active'
            const isRejected = t.status === 'rejected'

            return (
              <Card key={t.id} className="p-5" hover>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-lg">
                      {t.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{t.fullName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone size={12} /> {t.phone}</span>
                        <span className="flex items-center gap-1"><Wrench size={12} /> {t.garage}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {t.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:w-48">
                    <Badge
                      color={isActive ? 'green' : isPending ? 'yellow' : isRejected ? 'red' : 'gray'}
                    >
                      {t.status}
                    </Badge>
                    <p className="text-xs text-slate-400">Applied {fmtDate(t.createdAt)}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap lg:justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelected(t)}>
                      View Data
                    </Button>
                    
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAction(t.id, 'rejected')}
                          disabled={busyId === t.id}
                        >
                          {busyId === t.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(t.id, 'active')}
                          disabled={busyId === t.id}
                        >
                          {busyId === t.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Technician Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xl">
                {selected.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">{selected.fullName}</p>
                <Badge color={selected.status === 'active' ? 'green' : selected.status === 'pending' ? 'yellow' : 'red'}>
                  {selected.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium">{selected.phone || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{selected.email || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">City</p>
                <p className="font-medium">{selected.city || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500">Garage</p>
                <p className="font-medium">{selected.garage || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 col-span-2">
                <p className="text-xs text-slate-500">Address</p>
                <p className="font-medium">{selected.address || '—'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Experience</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selected.experience || 'No experience provided.'}
              </p>
            </div>

            {selected.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  className="flex-1"
                  variant="danger"
                  onClick={() => handleAction(selected.id, 'rejected')}
                  disabled={busyId === selected.id}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAction(selected.id, 'active')}
                  disabled={busyId === selected.id}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.title}>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              modal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
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