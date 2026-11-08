import { useEffect, useRef, useState } from 'react'
import { Store, MapPin, Phone, Loader2, RefreshCw } from 'lucide-react'
import { adminApi } from '../../lib/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function AdminGarages() {
  const [garages, setGarages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const pollTimer = useRef<number | null>(null)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await adminApi.garages()
      setGarages(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load + Real-time polling (every 2 seconds)
  useEffect(() => {
    load()
    pollTimer.current = window.setInterval(() => load(true), 2000)
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current)
    }
  }, [])

  const approve = async (id: string) => {
    await adminApi.setGarageStatus(id, 'active')
    load(true)
  }

  const reject = async (id: string) => {
    await adminApi.setGarageStatus(id, 'suspended')
    load(true)
  }

  const manualRefresh = () => {
    setRefreshing(true)
    load(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Garage Management</h1>
          <p className="text-slate-500 mt-1">Review, approve, and manage all garages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
            Live
          </div>
          <Button variant="outline" onClick={manualRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && garages.length === 0 ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading garages…
        </Card>
      ) : garages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No garages registered yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {garages.map((g) => (
            <Card key={g.id} className="p-5" hover>
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl gradient-brand text-white flex items-center justify-center">
                  <Store size={20} />
                </div>
                <Badge color={g.status === 'active' ? 'green' : g.status === 'pending' ? 'yellow' : 'red'}>
                  {g.status}
                </Badge>
              </div>
              <h3 className="font-bold text-slate-900">{g.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{g.ownerName}</p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2"><MapPin size={12} /> {g.address || '—'}</div>
                <div className="flex items-center gap-2"><Phone size={12} /> {g.primaryPhone || '—'}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{g.technicians ?? 0}</p>
                  <p className="text-xs text-slate-500">Technicians</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{((g.revenue || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-500">Revenue</p>
                </div>
              </div>
              {g.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => reject(g.id)}>Reject</Button>
                  <Button size="sm" className="flex-1" onClick={() => approve(g.id)}>Approve</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}