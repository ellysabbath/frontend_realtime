import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ownerApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Input, Textarea } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import {
  Store,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function OwnerRegister() {
  const nav = useNavigate()
  const { user } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    garageName: '',
    address: '',
    email: '',
    primaryPhone: '',
    secondaryPhone: '',
    expectations: '',
    acceptTerms: false,
  })
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const update = (k: string, v: string | boolean) =>
    setForm({ ...form, [k]: v })

  const submit = async () => {
    if (!user) {
      setModal({
        open: true,
        type: 'error',
        title: 'Not signed in',
        message: 'Please sign in again to register your garage.',
      })
      return
    }
    if (!form.acceptTerms) {
      setModal({
        open: true,
        type: 'error',
        title: 'Terms not accepted',
        message: 'Please accept the policies and terms of tApp before continuing.',
      })
      return
    }
    if (!form.garageName.trim() || !form.address.trim() || !form.email.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Missing details',
        message: 'Please fill in the garage name, address, and email.',
      })
      return
    }
    if (!form.primaryPhone.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Missing phone',
        message: 'Please provide at least one garage phone number.',
      })
      return
    }

    setSubmitting(true)
    try {
      await ownerApi.register({
        userId: user.userId,
        fullName: user.fullName,
        phone: user.phone,
        ...form,
      })
      nav('/owner/treaty')
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Registration failed',
        message:
          e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register Your Garage</h1>
        <p className="text-slate-500 mt-1">
          Join tApp as a garage owner and grow your business.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl gradient-brand text-white flex items-center justify-center mb-2">
          <Store size={26} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              value={user?.fullName || ''}
              readOnly
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              Auto-loaded from your account
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mobile Number
            </label>
            <input
              value={user?.phone || ''}
              readOnly
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              Auto-loaded from your account
            </p>
          </div>
        </div>

        <Input
          label="Garage / Center Name"
          placeholder="Mbezi Auto Center"
          value={form.garageName}
          onChange={(e) => update('garageName', e.target.value)}
        />
        <Input
          label="Garage Address"
          placeholder="Street, area, city"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Garage Email"
            type="email"
            placeholder="garage@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          <Input
            label="Primary Phone"
            placeholder="+255 712 345 678"
            value={form.primaryPhone}
            onChange={(e) => update('primaryPhone', e.target.value)}
          />
        </div>
        <Input
          label="Secondary Phone (optional)"
          placeholder="+255 712 345 679"
          value={form.secondaryPhone}
          onChange={(e) => update('secondaryPhone', e.target.value)}
        />

        <Textarea
          label="What do you expect when joining as a garage owner?"
          rows={3}
          placeholder="Tell us what you're looking for"
          value={form.expectations}
          onChange={(e) => update('expectations', e.target.value)}
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
            I accept the policies and terms of tApp
          </label>
        </div>

        <Button
          className="w-full inline-flex items-center justify-center gap-2"
          size="lg"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting
            </>
          ) : (
            <>
              <Store size={16} /> Continue to Treaty
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