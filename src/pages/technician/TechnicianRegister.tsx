import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { technicianApi, ownerApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'
import { Input, Textarea } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserPlus,
  Store,
} from 'lucide-react'

const HOME: Record<UserRole, string> = {
  customer: '/customer/dashboard',
  technician: '/technician/dashboard',
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function TechnicianRegister() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Garage loading state
  const [garages, setGarages] = useState<{ id: string; name: string }[]>([])
  const [loadingGarages, setLoadingGarages] = useState(true)

  const [form, setForm] = useState({
    city: '',
    country: 'Tanzania',
    address: '',
    email: '',
    garage: '',
    experience: '',
    acceptTerms: false,
  })
  
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  // Fetch active garages on mount
  useEffect(() => {
    ownerApi.activeGarages()
      .then((data) => {
        setGarages(data || [])
        if (data && data.length > 0) {
          setForm((prev) => ({ ...prev, garage: data[0].name }))
        }
      })
      .catch(console.error)
      .finally(() => setLoadingGarages(false))
  }, [])

  const update = (k: string, v: string | boolean) =>
    setForm({ ...form, [k]: v })

  const goHome = () => {
    const home = user ? HOME[user.role] : '/customer/dashboard'
    nav(home, { replace: true })
  }

  const submit = async () => {
    if (!user) {
      setModal({
        open: true,
        type: 'error',
        title: 'Not signed in',
        message: 'Please sign in again to submit your application.',
      })
      return
    }
    if (!form.acceptTerms) {
      setModal({
        open: true,
        type: 'error',
        title: 'Terms not accepted',
        message: 'Please accept the terms and policies before submitting.',
      })
      return
    }
    if (!form.garage) {
      setModal({
        open: true,
        type: 'error',
        title: 'No garage selected',
        message: 'Please select a garage to join.',
      })
      return
    }
    if (!form.city.trim() || !form.address.trim() || !form.email.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Missing details',
        message: 'Please fill in your city, address, and email before submitting.',
      })
      return
    }
    if (!form.experience.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Experience required',
        message:
          'Please describe your personal experience so the garage can review your application.',
      })
      return
    }

    setSubmitting(true)
    try {
      await technicianApi.register({
        userId: user.userId,
        fullName: user.fullName,
        phone: user.phone,
        ...form,
      })
      setSubmitted(true)
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Submission failed',
        message:
          e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Application Submitted
          </h2>
          <p className="text-slate-600 mb-6">
            Your technician application has been received. The garage you selected
            will be notified. You'll receive an SMS and email once an administrator
            approves your account.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 mb-6">
            Pending approval
          </div>
          <div className="flex justify-center">
            <Button onClick={goHome}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Become a Technician</h1>
        <p className="text-slate-500 mt-1">
          Join our network of verified vehicle technicians.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl gradient-brand text-white flex items-center justify-center mb-2">
          <UserPlus size={26} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full Name" defaultValue={user?.fullName || ''} disabled />
          <Input label="Mobile Number" defaultValue={user?.phone || ''} disabled />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Home City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Dar es Salaam"
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
            placeholder="Tanzania"
          />
        </div>

        <Input
          label="Address"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Street, area"
        />
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@example.com"
        />

        {/* Garage Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Store size={16} className="text-slate-400" />
            Select Garage
          </label>
          
          {loadingGarages ? (
             <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
               <Loader2 size={16} className="animate-spin" /> Loading garages...
             </div>
          ) : garages.length === 0 ? (
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-700 text-sm border border-yellow-200">
              No active garages available right now. Please try again later.
            </div>
          ) : (
            <select
              value={form.garage}
              onChange={(e) => update('garage', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            >
              {garages.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Textarea
          label="Personal Experience"
          rows={4}
          placeholder="Tell us about your experience…"
          value={form.experience}
          onChange={(e) => update('experience', e.target.value)}
        />

        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
          <input
            type="checkbox"
            id="terms"
            checked={form.acceptTerms}
            onChange={(e) => update('acceptTerms', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="terms" className="text-sm text-slate-600">
            I accept the terms and policies of tApp
          </label>
        </div>

        <Button
          className="w-full inline-flex items-center justify-center gap-2"
          size="lg"
          onClick={submit}
          disabled={submitting || loadingGarages || garages.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting
            </>
          ) : (
            <>
              <UserPlus size={16} /> Submit Application
            </>
          )}
        </Button>
      </Card>

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