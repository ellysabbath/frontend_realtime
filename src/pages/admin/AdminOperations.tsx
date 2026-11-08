import { useEffect, useState } from 'react'
import { Activity, MapPin, AlertTriangle } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/shared/StatCard'

export default function AdminOperations() {
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
        <h1 className="text-2xl font-bold text-slate-900">Live Operations</h1>
        <p className="text-slate-500 mt-1">Real-time overview of all platform activity.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Active Requests" value={stats.activeRequests} icon={<Activity size={20} />} color="blue" />
        <StatCard title="Total Technicians" value={stats.totalTechnicians} icon={<MapPin size={20} />} color="green" />
        <StatCard title="Pending Approvals" value={stats.pendingGarages + stats.pendingTechnicians} icon={<AlertTriangle size={20} />} color="orange" />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Requests</h2>
        {!stats.recentRequests || stats.recentRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentRequests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  {r.customerName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{r.problemType} — #{r.id}</p>
                  <p className="text-xs text-slate-500">{r.customerName} • {r.location}</p>
                </div>
                <Badge color={r.status === 'paid' ? 'green' : r.status === 'processing' ? 'purple' : 'blue'}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}