import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Store,
  Activity,
  UserPlus,
  FileText,
  ShieldCheck,
  Wrench,
  HandCoins,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'

interface MenuSection {
  title: string
  items: { to: string; label: string; icon: LucideIcon }[]
}

// ─── CUSTOMER — their own pages plus onboarding ───
const customerSections: MenuSection[] = [
  {
    title: 'Customer',
    items: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/customer/request/new', label: 'New Request', icon: PlusCircle },
      { to: '/customer/requests', label: 'My Requests', icon: ClipboardList },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/technician/register', label: 'Become Technician', icon: UserPlus },
      { to: '/owner/register', label: 'Become Garage Owner', icon: Store },
    ],
  },
]

// ─── TECHNICIAN — their own pages plus growth ───
const technicianSections: MenuSection[] = [
  {
    title: 'Technician',
    items: [
      { to: '/technician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/technician/jobs', label: 'My Jobs', icon: ClipboardList },
      { to: '/technician/requests', label: 'Available Requests', icon: Activity },
      { to: '/technician/revenue', label: 'Revenue', icon: DollarSign },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/owner/register', label: 'Become Garage Owner', icon: Store },
    ],
  },
]

// ─── OWNER — their own pages only ───
const ownerSections: MenuSection[] = [
  {
    title: 'Garage Management',
    items: [
      { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/owner/register', label: 'Register Garage', icon: Store },
      { to: '/owner/technicians', label: 'Technician Applications', icon: Users },
      { to: '/owner/documents', label: 'Garage Documents', icon: FileText },
      { to: '/owner/treaty', label: 'Treaty and Payment', icon: FileText },
    ],
  },
]

// ─── ADMIN — sees everything ───
const adminSections: MenuSection[] = [
  {
    title: 'Admin Control',
    items: [
      { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/requests', label: 'All Requests', icon: HandCoins },
      { to: '/admin/users', label: 'All Users', icon: Users },
      { to: '/admin/technicians', label: 'All Technicians', icon: Wrench },
      { to: '/admin/garages', label: 'All Garages', icon: Store },
      { to: '/admin/operations', label: 'System Operations', icon: Activity },
    ],
  },
  {
    title: 'Customer Area',
    items: customerSections[0].items,
  },
  {
    title: 'Technician Area',
    items: technicianSections[0].items,
  },
  {
    title: 'Owner Area',
    items: ownerSections[0].items,
  },
]

// The strict role mapping
const SECTIONS: Record<UserRole, MenuSection[]> = {
  customer: customerSections,
  technician: technicianSections,
  owner: ownerSections,
  admin: adminSections,
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  technician: 'Technician',
  owner: 'Garage Owner',
  admin: 'Administrator',
}

const HAS_FULL_ACCESS: Record<UserRole, boolean> = {
  customer: false,
  technician: false,
  owner: false,
  admin: true, // Only Admin has full access
}

export default function Sidebar() {
  const nav = useNavigate()
  const { user, logout } = useAuth()

  const sections = user ? SECTIONS[user.role] : []
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0)
  const initial = user?.fullName?.charAt(0).toUpperCase() || '?'
  const displayName = user?.fullName || 'Guest'
  const displayRole = user ? ROLE_LABEL[user.role] : 'Not signed in'
  const showFullAccessPill = user ? HAS_FULL_ACCESS[user.role] : false

  const handleLogout = () => {
    logout()
    nav('/login', { replace: true })
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg">
            t
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-none">tApp</h1>
            <p className="text-xs text-slate-400 mt-0.5">Vehicle Assistance</p>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-full gradient-brand text-white flex items-center justify-center font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500">{displayRole}</p>
          </div>
        </div>
        {showFullAccessPill && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 ring-1 ring-brand-200">
            <ShieldCheck size={10} />
            Full access enabled
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin">
        {totalItems === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-400">Please sign in.</div>
        ) : (
          sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
          <Settings size={18} />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}