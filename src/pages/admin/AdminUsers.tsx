import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users as UsersIcon,
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

interface AdminUser {
  id: string
  fullName: string
  phone: string
  role: string
  status: string
  verified?: boolean
  createdAt?: number
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

const ROLE_OPTIONS = ['customer', 'technician', 'owner', 'admin'] as const

const roleColor = (r: string): 'blue' | 'purple' | 'green' | 'yellow' => {
  if (r === 'technician') return 'purple'
  if (r === 'owner') return 'green'
  if (r === 'admin') return 'yellow'
  return 'blue'
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    role: 'customer' as string,
  })
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
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
      const rows = await adminApi.users()
      setUsers(rows)
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Could not load users',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ fullName: '', phone: '', role: 'customer' })
    setFormOpen(true)
  }

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setForm({
      fullName: u.fullName || '',
      phone: u.phone || '',
      role: u.role || 'customer',
    })
    setFormOpen(true)
  }

  const submitForm = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Missing fields',
        message: 'Full name and phone number are required.',
      })
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await adminApi.updateUser(editing.id, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          role: form.role,
        })
        setModal({
          open: true,
          type: 'success',
          title: 'User updated',
          message: `${form.fullName} was updated.`,
        })
      } else {
        await adminApi.createUser({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          role: form.role,
        })
        setModal({
          open: true,
          type: 'success',
          title: 'User created',
          message: `${form.fullName} was added.`,
        })
      }
      setFormOpen(false)
      await load()
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: editing ? 'Update failed' : 'Create failed',
        message: e instanceof Error ? e.message : 'Unexpected error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (u: AdminUser) => {
    setBusyId(u.id)
    try {
      const next = u.status === 'active' ? 'suspended' : 'active'
      await adminApi.setUserStatus(u.id, next)
      await load()
      setModal({
        open: true,
        type: 'success',
        title: next === 'active' ? 'User reactivated' : 'User suspended',
        message: `${u.fullName} is now ${next}.`,
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
      await adminApi.deleteUser(deleteTarget.id)
      await load()
      setModal({
        open: true,
        type: 'success',
        title: 'User deleted',
        message: `${deleteTarget.fullName} was removed.`,
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
    if (!q) return users
    return users.filter((u) => {
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.status || '').toLowerCase().includes(q)
      )
    })
  }, [users, search])

  const stats = useMemo(() => {
    const active = users.filter((u) => (u.status || 'active') === 'active').length
    const suspended = users.length - active
    const techs = users.filter((u) => u.role === 'technician').length
    return { active, suspended, techs }
  }, [users])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">
            View, create, edit, suspend, and delete users.
          </p>
        </div>
        <Button onClick={openCreate} className="inline-flex items-center gap-2">
          <UserPlus size={16} /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Suspended</p>
          <p className="text-2xl font-bold text-red-500">{stats.suspended}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Technicians</p>
          <p className="text-2xl font-bold text-purple-600">{stats.techs}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder="Search by name, phone, role, or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading users
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UsersIcon size={22} />
            </div>
            <p className="text-sm text-slate-500">
              {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
            </p>
            {users.length === 0 && (
              <Button className="mt-4" onClick={openCreate}>
                <UserPlus size={14} /> Add the first user
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">User</th>
                  <th className="text-left px-6 py-3 font-semibold">Phone</th>
                  <th className="text-left px-6 py-3 font-semibold">Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Verified</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isActive = (u.status || 'active') === 'active'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-bold">
                            {u.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {u.fullName || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-400">#{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge color={roleColor(u.role || 'customer')}>
                          {u.role || 'customer'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={isActive ? 'green' : 'red'}>
                          {u.status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={u.verified ? 'green' : 'gray'}>
                          {u.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(u)}
                            title="Edit user"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant={isActive ? 'outline' : 'primary'}
                            onClick={() => toggleStatus(u)}
                            disabled={busyId === u.id}
                            title={isActive ? 'Suspend' : 'Reactivate'}
                          >
                            {busyId === u.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isActive ? (
                              <UserX size={14} />
                            ) : (
                              <UserCheck size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit user' : 'Add user'}
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="John Mushi"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+255 700 000 000"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`p-3 rounded-xl border-2 text-left text-sm font-semibold transition-all ${
                    form.role === r
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving
                </>
              ) : editing ? (
                'Save changes'
              ) : (
                'Create user'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              Delete <strong>{deleteTarget?.fullName}</strong>? This removes the user
              and all their tokens, and cannot be undone.
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