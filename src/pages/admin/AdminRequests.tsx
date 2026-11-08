import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Wrench,
  ClipboardList,
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'

interface AdminRequest {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  location: string
  distance: number
  vehicleName: string
  vehicleType: string
  vehicleYear: string
  vehicleModel: string
  plateNumber: string
  problemType: string
  problemDescription: string
  status: string
  estimatedCost: number
  technicianId?: string
  technicianName?: string
  technicianPhone?: string
  technicianLocation?: string
  createdAt?: number
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

const STATUSES = ['pending', 'taken', 'processing', 'paid', 'cancelled'] as const
type StatusFilter = 'all' | (typeof STATUSES)[number]

const statusColor = (s: string): 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray' => {
  if (s === 'pending') return 'yellow'
  if (s === 'taken') return 'blue'
  if (s === 'processing') return 'purple'
  if (s === 'paid') return 'green'
  if (s === 'cancelled') return 'red'
  return 'gray'
}

export default function AdminRequests() {
  const [rows, setRows] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [selected, setSelected] = useState<AdminRequest | null>(null)
  const [editing, setEditing] = useState<AdminRequest | null>(null)
  const [editForm, setEditForm] = useState({
    status: 'pending',
    estimatedCost: '0',
    technicianName: '',
    technicianPhone: '',
    technicianLocation: '',
  })
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminRequest | null>(null)
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
      const data = await adminApi.requests()
      setRows(data)
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Could not load requests',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openEdit = (r: AdminRequest) => {
    setEditing(r)
    setEditForm({
      status: r.status || 'pending',
      estimatedCost: String(r.estimatedCost ?? 0),
      technicianName: r.technicianName || '',
      technicianPhone: r.technicianPhone || '',
      technicianLocation: r.technicianLocation || '',
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await adminApi.updateRequest(editing.id, {
        status: editForm.status,
        estimatedCost: Number(editForm.estimatedCost) || 0,
        technicianName: editForm.technicianName,
        technicianPhone: editForm.technicianPhone,
        technicianLocation: editForm.technicianLocation,
      })
      await load()
      setEditing(null)
      setModal({
        open: true,
        type: 'success',
        title: 'Request updated',
        message: `#${editing.id} was updated.`,
      })
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Update failed',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setSaving(false)
    }
  }

  const quickCancel = async (r: AdminRequest) => {
    setBusyId(r.id)
    try {
      await adminApi.updateRequest(r.id, { status: 'cancelled' })
      await load()
      setModal({
        open: true,
        type: 'success',
        title: 'Request cancelled',
        message: `#${r.id} was cancelled.`,
      })
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Action failed',
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
      await adminApi.deleteRequest(deleteTarget.id)
      await load()
      setDeleteTarget(null)
      setModal({
        open: true,
        type: 'success',
        title: 'Request deleted',
        message: `#${deleteTarget.id} was removed permanently.`,
      })
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
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!q) return true
      return (
        r.id.toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.customerPhone || '').includes(q) ||
        (r.problemType || '').toLowerCase().includes(q) ||
        (r.vehicleName || '').toLowerCase().includes(q) ||
        (r.vehicleModel || '').toLowerCase().includes(q) ||
        (r.plateNumber || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.technicianName || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, filter])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((r) =>
      ['pending', 'taken', 'processing'].includes(r.status),
    ).length
    const paid = rows.filter((r) => r.status === 'paid').length
    const cancelled = rows.filter((r) => r.status === 'cancelled').length
    const revenue = rows
      .filter((r) => r.status === 'paid')
      .reduce((s, r) => s + (r.estimatedCost || 0), 0)
    return { total, active, paid, cancelled, revenue }
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
        <p className="text-slate-500 mt-1">
          Every vehicle request on the platform, live from Firebase.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-2xl font-bold text-slate-900">
            {stats.revenue.toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search by ID, customer, vehicle, plate, tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
            {(['all', ...STATUSES] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading requests
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={22} />
            </div>
            <p className="text-sm text-slate-500">
              {rows.length === 0
                ? 'No requests yet.'
                : 'No requests match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Request</th>
                  <th className="text-left px-6 py-3 font-semibold">Customer</th>
                  <th className="text-left px-6 py-3 font-semibold">Technician</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Cost</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{r.problemType}</p>
                      <p className="text-xs text-slate-400">
                        #{r.id} • {r.vehicleName} {r.vehicleModel} • {r.plateNumber}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{r.customerName || '—'}</p>
                      <p className="text-xs text-slate-400">{r.customerPhone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {r.technicianName ? (
                        <>
                          <p className="text-slate-900">{r.technicianName}</p>
                          <p className="text-xs text-slate-400">{r.technicianPhone || '—'}</p>
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={statusColor(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {(r.estimatedCost || 0).toLocaleString()} TZS
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(r)}
                          title="View"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(r)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Button>
                        {r.status !== 'cancelled' && r.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => quickCancel(r)}
                            disabled={busyId === r.id}
                            title="Cancel"
                          >
                            {busyId === r.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              'Cancel'
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(r)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Request details">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">{selected.problemType}</p>
              <Badge color={statusColor(selected.status)}>{selected.status}</Badge>
            </div>
            <p className="text-sm text-slate-600">{selected.problemDescription}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400">Customer</p>
                <p className="text-slate-900 font-medium">{selected.customerName}</p>
                <p className="text-xs text-slate-500">{selected.customerPhone}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400">Vehicle</p>
                <p className="text-slate-900 font-medium">
                  {selected.vehicleName} {selected.vehicleModel}
                </p>
                <p className="text-xs text-slate-500">
                  {selected.vehicleYear} • {selected.plateNumber}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.location}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm text-slate-700">{selected.distance} km</span>
              </div>
              {selected.technicianName && (
                <div className="p-3 rounded-xl bg-slate-50 col-span-2">
                  <p className="text-xs text-slate-400">Technician</p>
                  <p className="text-slate-900 font-medium">{selected.technicianName}</p>
                  <p className="text-xs text-slate-500">{selected.technicianPhone}</p>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Estimated: {(selected.estimatedCost || 0).toLocaleString()} TZS
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit request">
        {editing && (
          <div className="space-y-4">
            <Select
              label="Status"
              options={STATUSES as unknown as string[]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />
            <Input
              label="Estimated cost (TZS)"
              type="number"
              value={editForm.estimatedCost}
              onChange={(e) =>
                setEditForm({ ...editForm, estimatedCost: e.target.value })
              }
            />
            <Input
              label="Technician name"
              value={editForm.technicianName}
              onChange={(e) =>
                setEditForm({ ...editForm, technicianName: e.target.value })
              }
              placeholder="Leave blank to unassign"
            />
            <Input
              label="Technician phone"
              value={editForm.technicianPhone}
              onChange={(e) =>
                setEditForm({ ...editForm, technicianPhone: e.target.value })
              }
            />
            <Input
              label="Technician location"
              value={editForm.technicianLocation}
              onChange={(e) =>
                setEditForm({ ...editForm, technicianLocation: e.target.value })
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete request">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              Delete request <strong>#{deleteTarget?.id}</strong>? This removes it from
              both `/requests` and `/technicianRequests` permanently.
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
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.title}>
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