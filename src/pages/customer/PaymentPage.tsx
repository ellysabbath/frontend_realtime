import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerApi, type ApiRequest } from '../../lib/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Check, CreditCard, Wallet, Banknote } from 'lucide-react'

export default function PaymentPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [request, setRequest] = useState<ApiRequest | null>(null)
  const [method, setMethod] = useState('mpesa')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    import('../../lib/api').then(({ customerApi }) => {
      customerApi
        .listRequests('')
        .then((rows) => setRequest(rows.find((r) => r.id === id) || null))
        .catch(console.error)
        .finally(() => setLoading(false))
    })
  }, [id])

  const methods = [
    { id: 'mpesa', label: 'M-PESA', icon: Wallet },
    { id: 'airtel', label: 'Airtel Money', icon: Wallet },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'cash', label: 'Cash', icon: Banknote },
  ]

  const confirm = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await customerApi.pay(id, method, method === 'cash' ? '' : reference)
      nav('/customer/requests')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!request) return <p className="text-slate-500">Request not found.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
        <p className="text-slate-500 mt-1">Complete payment for your service request.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Invoice Details</h2>
        <div className="space-y-3 text-sm">
          {[
            ['Order ID', `#${request.id}`],
            ['Customer', request.customerName],
            ['Phone', request.customerPhone],
            ['Location', request.location],
            ['Vehicle', `${request.vehicleName} ${request.vehicleModel}`],
            ['Problem', request.problemType],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-500">{k}</span>
              <span className="font-medium text-slate-900">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Travel cost ({request.distance} km × 1,000 TZS)</span>
            <span className="font-medium">{request.distance * 1000} TZS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Technician cost</span>
            <span className="font-medium">
              {(request.estimatedCost - request.distance * 1000).toLocaleString()} TZS
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-brand-200 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700">{request.estimatedCost.toLocaleString()} TZS</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Method</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                method === m.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <m.icon size={20} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-semibold text-slate-900">{m.label}</p>
            </button>
          ))}
        </div>

        {method !== 'cash' && (
          <div className="mt-4">
            <Input
              label="Reference Number"
              placeholder="Enter reference from mobile money"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => nav(-1)}>Back</Button>
          <Button className="flex-1" onClick={confirm} disabled={submitting}>
            <Check size={16} /> {submitting ? 'Processing…' : 'Confirm Payment'}
          </Button>
        </div>
      </Card>
    </div>
  )
}