import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Award } from 'lucide-react'
import { technicianApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/shared/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

export default function Revenue() {
  const { user } = useAuth()
  const [me, setMe] = useState<any>(null)
  const [data, setData] = useState<{ jobs: any[]; total: number; commission: number; net: number }>({
    jobs: [], total: 0, commission: 0, net: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    technicianApi
      .me(user.userId)
      .then((t) => {
        setMe(t)
        return technicianApi.revenue(t.id)
      })
      .then(setData)
      .catch(() => setMe(null))
      .finally(() => setLoading(false))
  }, [user?.userId])

  const chartData = data.jobs.map((j) => ({
    name: j.problemType?.slice(0, 8) || 'Job',
    income: j.estimatedCost || 0,
    commission: (j.estimatedCost || 0) * 0.1,
  }))

  if (loading) return <p className="text-slate-500">Loading</p>
  if (!me) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">You are not registered as a technician yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue and Earnings</h1>
        <p className="text-slate-500 mt-1">Track your income and commissions.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Total Earnings" value={`${data.total.toLocaleString()} TZS`} icon={<DollarSign size={20} />} color="green" />
        <StatCard title="Commission (10%)" value={`${data.commission.toLocaleString()} TZS`} icon={<TrendingUp size={20} />} color="blue" />
        <StatCard title="Net Payout" value={`${data.net.toLocaleString()} TZS`} icon={<Award size={20} />} color="orange" />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Income Breakdown</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500">No paid jobs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="income" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="commission" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Commission History</h2>
        {data.jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No paid jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {data.jobs.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">#{r.id} — {r.problemType}</p>
                  <p className="text-xs text-slate-500">{r.customerName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge color="green">{r.status}</Badge>
                  <p className="text-sm font-bold text-slate-900">{((r.estimatedCost || 0) * 0.9).toLocaleString()} TZS</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}