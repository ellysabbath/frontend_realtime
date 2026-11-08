import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { ownerApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function TreatyPage() {
  const nav = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState<'treaty' | 'payment' | 'done'>('treaty')
  const [method, setMethod] = useState('mpesa')
  const [reference, setReference] = useState('')
  const [garage, setGarage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })
  const pollTimer = useRef<number | null>(null)

  const loadGarage = async (silent = false) => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    try {
      const g = await ownerApi.me(user.userId)
      setGarage(g)
    } catch (err: any) {
      if (!silent) {
        setModal({
          open: true,
          type: 'error',
          title: 'No garage found',
          message: 'You have not registered a garage yet. Please complete the registration form first.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial load + Real-time polling (every 3 seconds)
  useEffect(() => {
    loadGarage()
    pollTimer.current = window.setInterval(() => loadGarage(true), 3000)
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current)
    }
  }, [user?.userId])

  const handleDownload = async () => {
    if (!garage) return
    setDownloading(true)
    try {
      const blob = await ownerApi.downloadTreaty(garage.id)
      const url = window.URL.createObjectURL(blob as any)
      const a = document.createElement('a')
      a.href = url
      a.download = `tApp_Treaty_${garage.name?.replace(/\s+/g, '_') || 'Garage'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setModal({
        open: true,
        type: 'error',
        title: 'Download failed',
        message: e.message || 'Could not download the treaty PDF.',
      })
    } finally {
      setDownloading(false)
    }
  }

  const payNow = async () => {
    if (!garage) {
      setModal({
        open: true,
        type: 'error',
        title: 'No garage',
        message: 'You need to register a garage first.',
      })
      return
    }
    if (method !== 'cash' && !reference.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: 'Reference required',
        message: 'Please enter the M-PESA / Airtel Money reference number.',
      })
      return
    }

    setSubmitting(true)
    try {
      await ownerApi.payFee(
        garage.id,
        method,
        method === 'cash' ? '' : reference.trim(),
      )
      setStep('done')
    } catch (e: unknown) {
      setModal({
        open: true,
        type: 'error',
        title: 'Payment failed',
        message: e instanceof Error ? e.message : 'Something went wrong. Try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !garage) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading your garage…
        </Card>
      </div>
    )
  }

  if (!garage) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No garage found</h2>
          <p className="text-sm text-slate-500 mb-6">
            You haven't registered a garage yet. Please complete the registration form
            first, then return to activate it.
          </p>
          <Button onClick={() => nav('/owner/register')}>
            Register a Garage
          </Button>
        </Card>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Payment Submitted
          </h2>
          <p className="text-slate-600 mb-2">
            Your garage registration payment is under review.
          </p>
          <Badge color="yellow">Pending Admin Approval</Badge>
          <p className="text-sm text-slate-500 mt-6">
            Your Garage ID will be generated once approved. You'll be notified by SMS
            and email.
          </p>
        </Card>
      </div>
    )
  }

  const isActive = garage.status === 'active'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Garage Treaty & Activation</h1>
          <p className="text-slate-500 mt-1">
            Download, sign, upload the treaty, then pay the activation fee.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
          <RefreshCw size={12} className="animate-spin" />
          Live Tracking
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className={`p-4 rounded-xl border flex gap-3 ${isActive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {isActive ? (
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-semibold ${isActive ? 'text-green-800' : 'text-yellow-800'}`}>
              {isActive ? 'Garage Activated!' : 'Activation Fee Required'}
            </p>
            <p className={`text-xs mt-1 ${isActive ? 'text-green-700' : 'text-yellow-700'}`}>
              {isActive
                ? 'Your garage is live. Customers and technicians can now find you on tApp.'
                : 'Pay 50,000 TZS to activate your garage account after uploading the signed treaty.'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">Registered garage</p>
          <p className="text-sm font-semibold text-slate-900">
            {garage.name || 'Unnamed garage'}
          </p>
          <p className="text-xs text-slate-500">{garage.address || '—'}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              color={
                garage.status === 'active'
                  ? 'green'
                  : garage.status === 'pending'
                  ? 'yellow'
                  : 'red'
              }
            >
              {garage.status || 'pending'}
            </Badge>
            {garage.garageId && (
              <span className="text-xs font-mono font-semibold text-slate-700">
                ID: {garage.garageId}
              </span>
            )}
          </div>
        </div>

        {!isActive && (
          <>
            {step === 'treaty' && (
              <>
                <h2 className="font-bold text-slate-900">Step 1: Treaty Document</h2>
                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Filled Treaty Document
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDownload} 
                      disabled={downloading}
                    >
                      {downloading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {downloading ? 'Downloading' : 'Download'}
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 cursor-pointer transition-colors">
                    <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      Upload signed & scanned treaty
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setStep('payment')}>
                  Continue to Payment
                </Button>
              </>
            )}

            {step === 'payment' && (
              <>
                <h2 className="font-bold text-slate-900">Step 2: Activation Payment</h2>
                <Input label="Amount" value="50,000 TZS" disabled />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'mpesa', label: 'M-PESA' },
                      { id: 'airtel', label: 'Airtel Money' },
                      { id: 'cash', label: 'Cash' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                          method === m.id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {method !== 'cash' && (
                  <Input
                    label="Reference Number"
                    placeholder="Enter reference from M-PESA / Airtel Money"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                )}
                <Button className="w-full" onClick={payNow} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Submit Payment
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setStep('treaty')}
                  className="w-full text-sm text-slate-500 hover:text-slate-900"
                >
                  ← Back to treaty
                </button>
              </>
            )}
          </>
        )}
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