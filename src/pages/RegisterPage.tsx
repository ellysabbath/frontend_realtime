import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  Loader2,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/ui/Modal'

interface ApiError extends Error {
  retryAfter?: number
  status?: number
}

function isApiError(e: unknown): e is ApiError {
  return e instanceof Error
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

export default function RegisterPage() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [hint, setHint] = useState('')
  const [err, setErr] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const startCooldown = (s: number) => setCooldown(Math.max(0, s || 60))

  const send = async () => {
    setErr('')
    setHint('')
    if (!fullName.trim()) {
      setErr('Full name is required')
      return
    }
    if (!phone.trim()) {
      setErr('Phone number is required')
      return
    }

    setSending(true)
    try {
      const res = await authApi.registerStart(phone, fullName)
      if (res.debugCode) setHint(`Dev OTP: ${res.debugCode}`)
      startCooldown(res.retryAfter ?? 60)
      setStep('otp')
    } catch (e: unknown) {
      if (isApiError(e) && e.status === 409) {
        setModal({
          open: true,
          type: 'error',
          title: 'Phone already registered',
          message:
            'This phone number already has an account. Please sign in instead.',
        })
        return
      }
      if (isApiError(e) && typeof e.retryAfter === 'number') {
        startCooldown(e.retryAfter)
        setErr(`Please wait ${e.retryAfter}s before trying again`)
        setStep('otp')
      } else {
        setErr(isApiError(e) ? e.message : 'Something went wrong')
      }
    } finally {
      setSending(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setErr('')
    setSending(true)
    try {
      const res = await authApi.resendOtp(phone)
      if (res.debugCode) setHint(`Dev OTP: ${res.debugCode}`)
      startCooldown(res.retryAfter ?? 60)
    } catch (e: unknown) {
      if (isApiError(e) && typeof e.retryAfter === 'number') {
        startCooldown(e.retryAfter)
        setErr(`Please wait ${e.retryAfter}s before resending`)
      } else {
        setErr(isApiError(e) ? e.message : 'Something went wrong')
      }
    } finally {
      setSending(false)
    }
  }

  const verify = async () => {
    setErr('')
    if (!code.trim()) {
      setErr('Enter the code')
      return
    }
    setVerifying(true)
    try {
      const res = await authApi.registerVerify(phone, code)

      const payload = res as Record<string, unknown>
      const u =
        payload.user && typeof payload.user === 'object'
          ? (payload.user as Record<string, unknown>)
          : payload

      const userId = typeof payload.userId === 'string' ? payload.userId : ''
      const userFullName =
        typeof u.fullName === 'string' ? u.fullName : fullName
      const userPhone = typeof u.phone === 'string' ? u.phone : phone
      const token = typeof payload.token === 'string' ? payload.token : ''

      if (!token) {
        setErr('Server did not return a token')
        return
      }

      login(
        {
          userId,
          fullName: userFullName,
          phone: userPhone,
          role: 'customer',
        },
        token,
      )

      setModal({
        open: true,
        type: 'success',
        title: 'Account created',
        message: `Welcome to tApp, ${userFullName.split(' ')[0]}! Redirecting to your dashboard…`,
      })
    } catch (e: unknown) {
      setErr(isApiError(e) ? e.message : 'Registration failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleModalClose = () => {
    const wasSuccess = modal.type === 'success'
    setModal({ ...modal, open: false })
    if (wasSuccess) {
      nav('/customer/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-brand relative overflow-hidden">
        <div className="relative flex flex-col justify-center p-16 text-white">
          <Link to="/" className="flex items-center gap-2.5 mb-12 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl">
              t
            </div>
            <span className="font-bold text-xl">tApp</span>
          </Link>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Get help on the road.
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Create an account with your phone number. We'll verify it with a one-time code.
          </p>
          <div className="space-y-4">
            {['No passwords', 'Phone verified', 'Sign in from any device'].map(
              (f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck size={12} />
                  </div>
                  <span className="text-white/90">{f}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white mb-6">
              {step === 'details' ? <UserPlus size={24} /> : <Smartphone size={24} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {step === 'details' ? 'Create your account' : 'Verify your phone'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {step === 'details'
                ? 'Just your name and phone number to get started.'
                : `We sent an SMS to ${phone}. Enter the code to finish.`}
            </p>

            {hint && step === 'otp' && (
              <p className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg p-2 mb-4">
                {hint}
              </p>
            )}
            {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

            {step === 'details' ? (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255 700 000 000"
                />
                <Button
                  className="w-full inline-flex items-center justify-center gap-2"
                  size="lg"
                  onClick={send}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending
                    </>
                  ) : (
                    <>
                      <Smartphone size={16} /> Send OTP
                    </>
                  )}
                </Button>

                <p className="text-sm text-center text-slate-500 pt-2">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="OTP Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-bold"
                />
                <Button
                  className="w-full inline-flex items-center justify-center gap-2"
                  size="lg"
                  onClick={verify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Create Account
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || sending}
                    className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                      cooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-brand-600 hover:text-brand-700'
                    }`}
                  >
                    <RefreshCw
                      size={14}
                      className={sending && cooldown === 0 ? 'animate-spin' : ''}
                    />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details')
                      setCode('')
                      setHint('')
                      setErr('')
                    }}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
                  >
                    <ChevronLeft size={14} /> Change details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
              {modal.type === 'success' ? 'Go to Dashboard' : 'Got it'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}