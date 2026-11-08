import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, DollarSign, Clock, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react'
import { customerApi } from '../../lib/api'
import { getSession } from '../../lib/session'
import StatCard from '../../components/shared/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const statusColor = (s: string) => {
  const map: Record<string, any> = {
    pending: 'yellow',
    taken: 'blue',
    processing: 'purple',
    paid: 'green',
    cancelled: 'red',
  }
  return map[s] || 'gray'
}

export default function CustomerDashboard() {
  const session = getSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    customerApi
      .dashboard(session.userId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session?.fullName.split(' ')[0] || 'Guest'}
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your vehicle requests.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active" value={data?.activeRequests ?? 0} icon={<Clock size={20} />} color="blue" />
        <StatCard title="Completed" value={data?.completedRequests ?? 0} icon={<CheckCircle size={20} />} color="green" />
        <StatCard title="Total Requests" value={data?.totalRequests ?? 0} icon={<ClipboardList size={20} />} color="purple" />
        <StatCard title="Total Spent" value={`${(data?.totalSpent ?? 0).toLocaleString()} TZS`} icon={<DollarSign size={20} />} color="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recent Requests</h2>
            <Link to="/customer/requests" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:gap-2">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : !data || data.recentRequests.length === 0 ? (
            <p className="text-sm text-slate-500">You have not made any requests yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentRequests.map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {r.vehicleName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.problemType}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {r.vehicleName} {r.vehicleModel} • {r.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge color={statusColor(r.status)}>{r.status}</Badge>
                    <p className="text-xs text-slate-500 mt-1">{r.estimatedCost.toLocaleString()} TZS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 gradient-brand text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <PlusCircle size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Need help now?</h3>
          <p className="text-white/80 text-sm mb-6">Start a new request and get a verified technician at your location.</p>
          <Link to="/customer/request/new">
            <Button className="w-full bg-white text-brand-700 hover:bg-white/90">
              Create New Request
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}