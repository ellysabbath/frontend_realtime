import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { customerApi } from '../../lib/api'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import {
  MapPin,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

const problemTypes = [
  'Engine failure',
  'Flat tire',
  'Battery dead',
  'Brake issue',
  'Overheating',
  'Transmission',
  'Electrical',
  'AC not working',
  'Other',
]

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function RequestForm() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(true)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    location: '',
    vehicleName: '',
    vehicleType: '',
    vehicleYear: '',
    vehicleModel: '',
    plateNumber: '',
    problemType: problemTypes[0],
    problemDescription: '',
  })

  // Keep name + phone in sync if auth context resolves after mount
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      fullName: user.fullName || f.fullName,
      phone: user.phone || f.phone,
    }))
  }, [user])

  // Auto-detect location on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocating(false)
      setModal({
        open: true,
        type: 'error',
        title: 'Location unavailable',
        message: 'Your browser does not support location detection. Please type your location.',
      })
      return
    }

    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const { latitude, longitude } = pos.coords
        const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        setForm((f) => (f.location ? f : { ...f, location: coords }))
        setLocating(false)
      },
      (err) => {
        if (cancelled) return
        setLocating(false)
        setModal({
          open: true,
          type: 'error',
          title: 'Could not detect location',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. Please type your location in the field.'
              : 'We could not read your GPS position. Please type your location in the field.',
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )

    return () => {
      cancelled = true
    }
  }, [])

  const update = (k: string, v: string) => setForm({ ...form, [k]: v })

  const detectLocationAgain = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        update('location', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setModal({
          open: true,
          type: 'error',
          title: 'Location unavailable',
          message: 'We could not read your GPS position. Please type your location manually.',
        })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleSubmit = async () => {
    if (!user) {
      setModal({
        open: true,
        type: 'error',
        title: 'Not signed in',
        message: 'Please sign in again to submit a request.',
      })
      return
    }
    if (!form.location.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Location required',
        message: 'Please provide a location so a technician can find you.',
      })
      return
    }
    if (!form.vehicleName.trim() || !form.problemDescription.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Missing details',
        message: 'Please fill in the vehicle name and describe the problem before submitting.',
      })
      return
    }

    setSubmitting(true)
    try {
      await customerApi.createRequest({
        ...form,
        customerId: user.userId,
      })
      setModal({
        open: true,
        type: 'success',
        title: 'Request submitted',
        message: 'A technician will be assigned to your request shortly.',
      })
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Submission failed',
        message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalClose = () => {
    const wasSuccess = modal.type === 'success'
    setModal({ ...modal, open: false })
    if (wasSuccess) {
      nav('/customer/requests')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Vehicle Request</h1>
        <p className="text-slate-500 mt-1">
          Tell us about your vehicle and the problem you are facing.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'gradient-brand text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 rounded-full ${
                  step > s ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Details</h2>

            <Input
              label="Full Name"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location
              </label>
              <div className="relative">
                <input
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder={locating ? 'Detecting your location…' : 'Your current location'}
                  className="w-full px-4 py-2.5 pr-24 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={detectLocationAgain}
                  disabled={locating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors disabled:opacity-60"
                >
                  {locating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Detecting
                    </>
                  ) : (
                    <>
                      <MapPin size={12} />
                      Detect
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Detected automatically using your device GPS. You can edit it if needed.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Vehicle Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Vehicle Name"
                placeholder="Toyota"
                value={form.vehicleName}
                onChange={(e) => update('vehicleName', e.target.value)}
              />
              <Input
                label="Vehicle Type"
                placeholder="SUV"
                value={form.vehicleType}
                onChange={(e) => update('vehicleType', e.target.value)}
              />
              <Input
                label="Year of Production"
                placeholder="2018"
                value={form.vehicleYear}
                onChange={(e) => update('vehicleYear', e.target.value)}
              />
              <Input
                label="Vehicle Model"
                placeholder="RAV4"
                value={form.vehicleModel}
                onChange={(e) => update('vehicleModel', e.target.value)}
              />
            </div>
            <Input
              label="TIN (Plate Number)"
              placeholder="T 123 ABC"
              value={form.plateNumber}
              onChange={(e) => update('plateNumber', e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Problem Details</h2>
            <Select
              label="Problem Type"
              options={problemTypes}
              value={form.problemType}
              onChange={(e) => update('problemType', e.target.value)}
            />
            <Textarea
              label="Problem Description"
              rows={5}
              placeholder="Describe the problem in detail…"
              value={form.problemDescription}
              onChange={(e) => update('problemDescription', e.target.value)}
            />
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-sm text-brand-800">
                <strong>Estimated cost:</strong> 1,000 TZS per km traveled by the
                technician. The final technician cost will be shown before payment.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft size={16} /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting
                </>
              ) : (
                <>
                  Submit Request <Check size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      <Modal open={modal.open} onClose={handleModalClose} title={modal.title}>
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
              onClick={handleModalClose}
            >
              {modal.type === 'success' ? 'View My Requests' : 'Got it'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}