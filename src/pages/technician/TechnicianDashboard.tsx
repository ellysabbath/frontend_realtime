import { useEffect, useState } from 'react'
import { DollarSign, ClipboardList, Star, TrendingUp } from 'lucide-react'
import { technicianApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/shared/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function TechnicianDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    technicianApi
      .dashboard(user.userId)
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [user?.userId])

  if (loading) return <p className="text-slate-500">Loading</p>

  if (err) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-700 font-semibold mb-2">
          Not registered as a technician yet
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Register first to start accepting jobs.
        </p>
        <a href="/technician/register" className="text-brand-600 font-semibold">
          Go to registration
        </a>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user?.fullName.split(' ')[0] || 'Technician'}
        </h1>
        <p className="text-slate-500 mt-1">Here's your performance overview.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Jobs" value={data?.activeJobs ?? 0} icon={<ClipboardList size={20} />} color="blue" />
        <StatCard title="Total Jobs" value={data?.totalJobs ?? 0} icon={<ClipboardList size={20} />} color="purple" />
        <StatCard title="Income" value={`${(data?.totalIncome ?? 0).toLocaleString()} TZS`} icon={<DollarSign size={20} />} color="green" />
        <StatCard title="Status" value={data?.technician?.status || '—'} icon={<Star size={20} />} color="orange" />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Jobs</h2>
        {!data?.recentJobs || data.recentJobs.length === 0 ? (
          <p className="text-sm text-slate-500">No jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {data.recentJobs.map((r: any) => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  {r.customerName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{r.customerName}</p>
                  <p className="text-xs text-slate-500 truncate">{r.problemType} • {r.location}</p>
                </div>
                <Badge color={r.status === 'paid' ? 'green' : 'blue'}>{r.status}</Badge>
                <p className="text-sm font-bold text-slate-900">{r.estimatedCost?.toLocaleString() ?? 0} TZS</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}