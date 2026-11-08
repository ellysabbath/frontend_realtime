import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './components/layout/DashboardLayout'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import MyRequests from './pages/customer/MyRequests'
import RequestForm from './pages/customer/RequestForm'
import PaymentPage from './pages/customer/PaymentPage'
import TechnicianDashboard from './pages/technician/TechnicianDashboard'
import TechnicianRequests from './pages/technician/TechnicianRequests'
import Revenue from './pages/technician/Revenue'
import TechnicianRegister from './pages/technician/TechnicianRegister'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import OwnerRegister from './pages/owner/OwnerRegister'
import TreatyPage from './pages/owner/TreatyPage'
import AdminDashboard from './pages/admin/AdminDashboard'

import AdminUsers from './pages/admin/AdminUsers'
import AdminGarages from './pages/admin/AdminGarages'
import AdminOperations from './pages/admin/AdminOperations'
import { useAuth } from './context/AuthContext'
import type { UserRole } from './context/AuthContext'
import AdminTechnicians from './pages/admin/AdminTechnicians'
import AdminRequests from './pages/admin/AdminRequests'
import MyJobs from './pages/technician/MyJobs'
import ChatPage from './pages/ChatPage'
import GarageDocuments from './pages/owner/GarageDocuments'
import OwnerTech from './pages/owner/OwnerTech'

const HOME: Record<UserRole, string> = {
  customer: '/customer/dashboard',
  technician: '/technician/dashboard',
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
}

function RequireRole({
  allow,
  children,
}: {
  allow: UserRole[]
  children: ReactNode
}) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to={HOME[user.role]} replace />
  return <>{children}</>
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Loading</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat/:requestId" element={<ChatPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* CUSTOMER AREA — customer, technician, admin */}
      <Route
        path="/customer"
        element={
          <RequireRole allow={['customer', 'technician', 'admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="request/new" element={<RequestForm />} />
        <Route path="payment/:id" element={<PaymentPage />} />
      </Route>

      {/* TECHNICIAN AREA — technician, admin */}
      <Route
        path="/technician"
        element={
          <RequireRole allow={['technician', 'admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/technician/dashboard" replace />} />
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="requests" element={<TechnicianRequests />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="jobs" element={<MyJobs />} />
      </Route>

      {/* TECHNICIAN ONBOARDING — customer, technician, admin */}
      <Route
        path="/technician/register"
        element={
          <RequireRole allow={['customer', 'technician', 'admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        
        <Route index element={<TechnicianRegister />} />
      </Route>

      {/* OWNER AREA — owner, technician, admin */}
      <Route
        path="/owner"
        element={
          <RequireRole allow={['owner', 'technician', 'admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="treaty" element={<TreatyPage />} />
        <Route path="documents/:id" element={<GarageDocuments />} />
        <Route path="technicians" element={<OwnerTech />} />
      </Route>

      {/* OWNER ONBOARDING — customer, technician, owner, admin */}
      <Route
        path="/owner/register"
        element={
          <RequireRole allow={['customer', 'technician', 'owner', 'admin']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<OwnerRegister />} />
      </Route>

      {/* ADMIN AREA — admin, technician */}
      <Route
        path="/admin"
        element={
          <RequireRole allow={['admin', 'technician']}>
            <DashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="garages" element={<AdminGarages />} />
        <Route path="operations" element={<AdminOperations />} />
        <Route path="operations" element={<AdminOperations />} />
        <Route path="technicians" element={<AdminTechnicians />} />
        <Route path="reqs" element={<AdminRequests />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}