import { useEffect, useState } from 'react'
import { Users, Store, Activity, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { adminApi } from '../../lib/api'
import StatCard from '../../components/shared/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500 mt-1">Platform-wide metrics and operations.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={20} />} color="blue" />
        <StatCard title="Active Garages" value={stats.totalGarages} icon={<Store size={20} />} color="green" />
        <StatCard title="Active Requests" value={stats.activeRequests} icon={<Activity size={20} />} color="orange" />
        <StatCard title="Revenue" value={`${(stats.revenue || 0).toLocaleString()} TZS`} icon={<DollarSign size={20} />} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" /> Pending Approvals
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-700">Garages pending</p>
              <Badge color="yellow">{stats.pendingGarages}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-700">Technicians pending</p>
              <Badge color="yellow">{stats.pendingTechnicians}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" /> Recent Requests
          </h2>
          {!stats.recentRequests || stats.recentRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentRequests.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.problemType}</p>
                    <p className="text-xs text-slate-500">{r.customerName}</p>
                  </div>
                  <Badge color={r.status === 'paid' ? 'green' : 'blue'}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}