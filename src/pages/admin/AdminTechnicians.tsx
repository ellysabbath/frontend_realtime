import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Wrench,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Users as UsersIcon,
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

interface AdminTechnician {
  id: string
  userId: string
  fullName: string
  phone: string
  email?: string
  city?: string
  country?: string
  address?: string
  garage?: string
  experience?: string
  status: string
  technicianId?: string
  createdAt?: number
}

interface SmsReport {
  phone?: string
  message1?: { sent: boolean; error: string | null }
  message2?: { sent: boolean; error: string | null }
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

const statusColor = (s: string): 'yellow' | 'green' | 'red' => {
  if (s === 'active') return 'green'
  if (s === 'suspended') return 'red'
  return 'yellow'
}

export default function AdminTechnicians() {
  const [rows, setRows] = useState<AdminTechnician[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminTechnician | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminTechnician | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.technicians()
      setRows(data)
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Could not load technicians',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (
    t: AdminTechnician,
    next: 'active' | 'suspended' | 'pending',
  ) => {
    setBusyId(t.id)
    try {
      const res = (await adminApi.setTechnicianStatus(t.id, next)) as {
        sms?: SmsReport
      } | null

      const sms = res?.sms
      const technicianIdFromServer =
        (res as any)?.technicianId ?? t.technicianId

      let extra = ''
      let smsOk = true
      if (next === 'active' && sms) {
        smsOk = !!(sms.message1?.sent && sms.message2?.sent)
        if (smsOk) {
          extra = ` Two SMS messages were sent to ${sms.phone ?? t.phone}: congratulations with Technician ID ${technicianIdFromServer}, and an invitation to become a garage owner.`
        } else {
          const err1 = sms.message1?.error
          const err2 = sms.message2?.error
          extra = ` SMS delivery failed: ${err1 || err2 || 'unknown error'}. Check Africa's Talking.`
        }
      }

      await load()

      setModal({
        open: true,
        type: smsOk ? 'success' : 'error',
        title:
          next === 'active'
            ? smsOk
              ? 'Technician approved'
              : 'Approved but SMS failed'
            : next === 'suspended'
            ? 'Technician suspended'
            : 'Technician pending',
        message: `${t.fullName} is now ${next}.${extra}`,
      })
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Update failed',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteTechnician(deleteTarget.id)
      await load()
      setModal({
        open: true,
        type: 'success',
        title: 'Technician removed',
        message: `${deleteTarget.fullName} was deleted.`,
      })
      setDeleteTarget(null)
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Delete failed',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((t) => {
      if (filter !== 'all' && (t.status || 'pending') !== filter) return false
      if (!q) return true
      return (
        (t.fullName || '').toLowerCase().includes(q) ||
        (t.phone || '').includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.city || '').toLowerCase().includes(q) ||
        (t.garage || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, filter])

  const stats = useMemo(() => {
    const pending = rows.filter((t) => (t.status || 'pending') === 'pending').length
    const active = rows.filter((t) => t.status === 'active').length
    const suspended = rows.filter((t) => t.status === 'suspended').length
    return { total: rows.length, pending, active, suspended }
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technicians</h1>
        <p className="text-slate-500 mt-1">
          View every technician registered on the platform, approve applications, and manage access.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Suspended</p>
          <p className="text-2xl font-bold text-red-500">{stats.suspended}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search by name, phone, email, city, or garage"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'pending', 'active', 'suspended'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading technicians
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UsersIcon size={22} />
            </div>
            <p className="text-sm text-slate-500">
              {rows.length === 0
                ? 'No technicians have registered yet.'
                : 'No technicians match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Technician</th>
                  <th className="text-left px-6 py-3 font-semibold">Phone</th>
                  <th className="text-left px-6 py-3 font-semibold">City</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">ID</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const status = t.status || 'pending'
                  const isActive = status === 'active'
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-bold">
                            {t.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {t.fullName || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {t.garage || 'No garage'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{t.phone || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">{t.city || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge color={statusColor(status)}>{status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {t.technicianId || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(t)}
                            title="View details"
                          >
                            <Eye size={14} />
                          </Button>
                          {isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatus(t, 'suspended')}
                              disabled={busyId === t.id}
                              title="Suspend"
                            >
                              {busyId === t.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setStatus(t, 'active')}
                              disabled={busyId === t.id}
                              title="Approve / Reactivate"
                            >
                              {busyId === t.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserCheck size={14} />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(t)}
                            title="Delete technician"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Technician details"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xl">
                {selected.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900">{selected.fullName}</p>
                <Badge color={statusColor(selected.status || 'pending')}>
                  {selected.status || 'pending'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Phone size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  {selected.address || '—'}
                  {selected.city ? `, ${selected.city}` : ''}
                  {selected.country ? `, ${selected.country}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Wrench size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  Garage: {selected.garage || '—'}
                </span>
              </div>
            </div>

            {selected.experience && (
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Experience</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selected.experience}
                </p>
              </div>
            )}

            <div className="text-xs text-slate-400">
              Technician ID: {selected.technicianId || 'Not yet assigned'}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete technician"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              Delete <strong>{deleteTarget?.fullName}</strong>? Their technician record
              will be removed. The underlying user account remains, but they will no
              longer be able to accept jobs.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Deleting
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feedback modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                modal.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {modal.type === 'success' ? (
                <CheckCircle2 size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              {modal.message}
            </p>
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