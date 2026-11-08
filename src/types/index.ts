export type UserRole = 'customer' | 'technician' | 'owner' | 'admin' | 'support'

export interface User {
  id: string
  fullName: string
  phone: string
  role: UserRole
  email?: string
  avatar?: string
  city?: string
}

export type RequestStatus = 'pending' | 'taken' | 'processing' | 'paid' | 'cancelled'

export interface ServiceRequest {
  id: string
  customerName: string
  customerPhone: string
  location: string
  distance: number
  vehicleName: string
  vehicleType: string
  vehicleYear: string
  vehicleModel: string
  plateNumber: string
  problemType: string
  problemDescription: string
  status: RequestStatus
  technicianName?: string
  technicianPhone?: string
  technicianLocation?: string
  estimatedCost: number
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface Garage {
  id: string
  name: string
  ownerName: string
  city: string
  email: string
  phone: string
  status: 'pending' | 'active' | 'suspended'
  technicians: number
  revenue: number
}