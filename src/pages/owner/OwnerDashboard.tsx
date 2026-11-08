import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  DollarSign,
  Wrench,
  Store,
  Loader2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FileText,
} from 'lucide-react'
import { ownerApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/shared/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function OwnerDashboard() {
  const nav = useNavigate()
  const { user } = useAuth()

  // State for owned garages
  const [garages, setGarages] = useState<any[]>([])
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null)
  
  // State for the selected garage's dashboard data
  const [dashData, setDashData] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimer = useRef<number | null>(null)

  // ── 1. Load owned garages ──
  const loadGarages = async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)
    
    try {
      const owned = await ownerApi.me(user.userId)
      setGarages(owned || [])
      
      // If none selected yet, select the first one
      if (!selectedGarageId && owned.length > 0) {
        setSelectedGarageId(owned[0].id)
      } else if (owned.length === 0) {
        setSelectedGarageId(null)
      }
    } catch (e) {
      console.error('Failed to load garages:', e)
    } finally {
      if (!silent) setLoading(false)
      setRefreshing(false)
    }
  }

  // ── 2. Load dashboard data for the selected garage ──
  const loadDashboard = async (gid: string, silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const dash = await ownerApi.dashboard(gid)
      setDashData(dash)
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      if (!silent) setRefreshing(false)
    }
  }

  // ── 3. Initial fetch & Real-time polling ──
  useEffect(() => {
    loadGarages()
  }, [user?.userId])

  useEffect(() => {
    if (selectedGarageId) {
      loadDashboard(selectedGarageId)
    }
  }, [selectedGarageId])

  // ── 4. Real-time polling every 5 seconds ──
  useEffect(() => {
    if (!user) return
    refreshTimer.current = window.setInterval(() => {
      loadGarages(true)
      if (selectedGarageId) {
        loadDashboard(selectedGarageId, true)
      }
    }, 5000)

    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current)
    }
  }, [user?.userId, selectedGarageId])

  const manualRefresh = () => {
    setRefreshing(true)
    loadGarages(true)
    if (selectedGarageId) loadDashboard(selectedGarageId, true)
  }

  // ── Loading state ──
  if (loading && garages.length === 0) {
    return (
      <Card className="p-10 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 size={18} className="animate-spin" /> Loading your garages…
      </Card>
    )
  }

  // ── No garages state ──
  if (garages.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="w-14 h-14 rounded-2xl gradient-brand text-white flex items-center justify-center mx-auto mb-4">
          <Store size={26} />
        </div>
        <p className="text-slate-700 font-semibold mb-2">No garage registered yet</p>
        <p className="text-sm text-slate-500 mb-4">
          Register your garage to start managing technicians and accepting jobs.
        </p>
        <Button onClick={() => nav('/owner/register')}>Register Garage</Button>
      </Card>
    )
  }

  const selectedGarage = garages.find((g) => g.id === selectedGarageId) || garages[0]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Garages</h1>
          <p className="text-slate-500 mt-1">Manage all your registered garages.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => nav('/owner/register')}>
            <PlusCircle size={16} className="mr-1" /> Add Garage
          </Button>
          <Button
            variant="outline"
            onClick={manualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2"
          >
            {refreshing ? (
              <><Loader2 size={14} className="animate-spin" /> Refreshing</>
            ) : (
              <><RefreshCw size={14} /> Refresh</>
            )}
          </Button>
        </div>
      </div>

      {/* Garage Selector Tabs */}
      {garages.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {garages.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGarageId(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedGarageId === g.id
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {g.name || 'Unnamed Garage'}
              {g.status === 'active' && <span className="ml-2 text-green-500">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Status Banner */}
      {selectedGarage.status === 'active' && selectedGarage.garageId && (
        <Card className="p-5 border-l-4 border-l-green-500 bg-green-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Garage approved</p>
              <p className="text-xs text-green-800 mt-1">
                Your Garage ID: <strong>{selectedGarage.garageId}</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {selectedGarage.status === 'pending' && (
        <Card className="p-5 border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-900">Pending approval</p>
              <p className="text-xs text-yellow-800 mt-1">
                This garage is being reviewed. Updates appear automatically.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dashboard Data for Selected Garage */}
      {!dashData ? (
        <Card className="p-10 flex justify-center text-slate-500">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading dashboard...
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Technicians" value={dashData.totalTechnicians ?? 0} icon={<Users size={20} />} color="blue" />
            <StatCard title="Revenue" value={`${(dashData.revenue || 0).toLocaleString()} TZS`} icon={<DollarSign size={20} />} color="green" />
            <StatCard title="Requests" value={dashData.totalRequests ?? 0} icon={<Wrench size={20} />} color="orange" />
            <StatCard title="Status" value={selectedGarage.status || 'pending'} icon={<Store size={20} />} color="purple" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Garage Details */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Store size={18} className="text-slate-500" />
                Garage details
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-slate-900 font-medium">{selectedGarage.name || '—'}</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-slate-900">{selectedGarage.address || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-slate-900">{selectedGarage.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-slate-900">{selectedGarage.primaryPhone || '—'}</p>
                  </div>
                </div>
              </div>

              {/* NEW: View Documents Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => nav(`/owner/documents/${selectedGarage.id}`)}
                >
                  <FileText size={16} className="mr-2" />
                  View Documents & Records
                </Button>
              </div>
            </Card>

            {/* Technician Roster */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-slate-500" />
                Technician roster
              </h2>
              {!dashData.technicians || dashData.technicians.length === 0 ? (
                <p className="text-sm text-slate-500">No technicians assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {dashData.technicians.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-full gradient-brand text-white flex items-center justify-center font-bold">
                        {t.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.fullName}</p>
                        <p className="text-xs text-slate-500">{t.phone}</p>
                      </div>
                      <Badge color={t.status === 'active' ? 'green' : t.status === 'suspended' ? 'red' : 'yellow'}>
                        {t.status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}