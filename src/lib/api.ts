const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'tapp_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    headers,
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e: any = new Error(err.error || `HTTP ${res.status}`)
    e.retryAfter = err.retryAfter
    e.status = res.status
    throw e
  }
  return res.json()
}

// ✅ NEW: Helper for downloading binary files (PDF)
async function downloadFile(path: string): Promise<Blob> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, { headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e: any = new Error(err.error || `HTTP ${res.status}`)
    e.status = res.status
    throw e
  }
  return res.blob()
}

export interface ApiRequest {
  id: string
  customerId: string
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
  vehiclePhoto?: string
  problemDescription: string
  status: string
  estimatedCost: number
  technicianId?: string
  technicianName?: string
  technicianPhone?: string
  technicianLocation?: string
  technicianLat?: number
  technicianLng?: number
  createdAt?: number
}

export const authApi = {
  sendOtp: (phone: string) =>
    http<{ sent: boolean; debugCode?: string; retryAfter: number }>(
      '/auth/otp/send/',
      { method: 'POST', body: JSON.stringify({ phone }) },
    ),
  resendOtp: (phone: string) =>
    http<{ sent: boolean; debugCode?: string; retryAfter: number }>(
      '/auth/otp/resend/',
      { method: 'POST', body: JSON.stringify({ phone }) },
    ),
  verifyOtp: (phone: string, code: string) =>
    http<{ userId: string; user?: any; token: string }>('/auth/otp/verify/', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
  registerStart: (phone: string, fullName: string) =>
    http<{ sent: boolean; debugCode?: string; retryAfter: number }>(
      '/auth/register/start/',
      { method: 'POST', body: JSON.stringify({ phone, fullName }) },
    ),
  registerVerify: (phone: string, code: string) =>
    http<{ userId: string; user?: any; token: string }>('/auth/register/verify/', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
  me: (token: string) =>
    http<{ userId: string; user: any }>(`/auth/me/?token=${encodeURIComponent(token)}`),
  logout: (token: string) =>
    http<{ loggedOut: boolean }>('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
}

export const customerApi = {
  listRequests: (customerId: string) =>
    http<ApiRequest[]>(`/customer/requests/?customerId=${customerId}`),
  createRequest: (body: any) =>
    http<{ id: string }>('/customer/requests/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelRequest: (id: string) =>
    http(`/customer/requests/${id}/`, { method: 'DELETE' }),
  pay: (id: string, method: string, reference?: string) =>
    http(`/customer/requests/${id}/pay/`, {
      method: 'POST',
      body: JSON.stringify({ method, reference }),
    }),
  dashboard: (customerId: string) =>
    http<any>(`/customer/dashboard/?customerId=${customerId}`),
}

export const technicianApi = {
  register: (body: any) =>
    http<{ id: string }>('/technician/register/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: (userId: string) => http<any>(`/technician/me/?userId=${userId}`),
  availableRequests: () => http<ApiRequest[]>('/technician/requests/'),
  
  acceptRequest: (
    rid: string,
    technicianId: string,
    technicianName: string,
    technicianPhone: string,
    lat: number,
    lng: number,
  ) =>
    http(`/technician/requests/${rid}/accept/`, {
      method: 'POST',
      body: JSON.stringify({
        technicianId,
        technicianName,
        technicianPhone,
        lat,
        lng,
      }),
    }),
    
  updateLocation: (rid: string, lat: number, lng: number) =>
    http(`/technician/requests/${rid}/location/`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    }),

  myJobs: (technicianId: string) =>
    http<ApiRequest[]>(`/technician/jobs/?technicianId=${technicianId}`),
  revenue: (technicianId: string) =>
    http<{ jobs: ApiRequest[]; total: number; commission: number; net: number }>(
      `/technician/revenue/?technicianId=${technicianId}`,
    ),
  dashboard: (userId: string) =>
    http<any>(`/technician/dashboard/?userId=${userId}`),
}

export const ownerApi = {
  register: (body: any) =>
    http<{ id: string; status: string; sms: any }>('/owner/register/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

    uploadTreaty: (garageId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Use a direct fetch call instead of http() to handle FormData correctly
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return fetch(`${BASE}/owner/garages/${garageId}/upload-treaty/`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }
      return res.json()
    })
  },

 activeGarages: () => 
    http<{ id: string; name: string; city: string }[]>('/owner/garages/active/'),
    
  me: (userId: string) => 
    http<any[]>(`/owner/me/?userId=${userId}`),

  garageDocuments: (garageId: string) =>
    http<any>(`/owner/garages/${garageId}/documents/`),
    
  dashboard: (garageId: string) =>
    http<any>(`/owner/dashboard/?garageId=${garageId}`),
    
  payFee: (garageId: string, method: string, reference?: string) =>
    http(`/owner/garages/${garageId}/pay-fee/`, {
      method: 'POST',
      body: JSON.stringify({ method, reference }),
    }),

  garageTechnicians: (ownerId: string) =>
    http<any[]>(`/owner/technicians/?ownerId=${ownerId}`),
    
  approveTechnician: (tid: string, status: 'active' | 'rejected') =>
    http(`/owner/technicians/${tid}/approve/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    
  // ✅ UPDATED: Use downloadFile instead of http
  downloadTreaty: (garageId: string) =>
    downloadFile(`/owner/treaty/${garageId}/download/`),
}

export const adminApi = {
  users: () => http<any[]>('/admin/users/'),
  createUser: (body: { fullName: string; phone: string; role: string }) =>
    http<{ id: string; user: any }>('/admin/users/create/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  requests: () => http<any[]>('/admin/requests/'),
  updateRequest: (id: string, patch: Record<string, unknown>) =>
    http(`/admin/requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteRequest: (id: string) =>
    http(`/admin/requests/${id}/delete/`, { method: 'DELETE' }),
  updateUser: (id: string, patch: Record<string, unknown>) =>
    http(`/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  setUserStatus: (id: string, status: string) =>
    http(`/admin/users/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteUser: (id: string) =>
    http(`/admin/users/${id}/delete/`, { method: 'DELETE' }),
  garages: () => http<any[]>('/admin/garages/'),
  setGarageStatus: (id: string, status: string) =>
    http(`/admin/garages/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  technicians: () => http<any[]>('/admin/technicians/'),
  setTechnicianStatus: (id: string, status: string) =>
    http(`/admin/technicians/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTechnician: (id: string) =>
    http(`/admin/technicians/${id}/delete/`, { method: 'DELETE' }),
  stats: () => http<any>('/admin/stats/'),
}

export const chatApi = {
  messages: (requestId: string) =>
    http<any[]>(`/chat/messages/?requestId=${encodeURIComponent(requestId)}`),
    
  send: (body: { requestId: string; text: string }) => {
    const token = getToken()
    return http<{ id: string }>('/chat/messages/send/', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  },

  markRead: (requestId: string, readerRole: 'customer' | 'technician') =>
    http(`/chat/messages/${requestId}/read/`, {
      method: 'PATCH',
      body: JSON.stringify({ readerRole }),
    }),

  typing: (requestId: string, role: 'customer' | 'technician', isTyping: boolean) =>
    http(`/chat/typing/`, {
      method: 'POST',
      body: JSON.stringify({ requestId, role, typing: isTyping }),
    }),
}

export const locationApi = {
  // For customer to send their GPS
  update: (requestId: string, lat: number, lng: number) =>
    http(`/customer/requests/${requestId}/update-location/`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    }),

  // For technician to fetch the latest GPS
  get: (requestId: string) =>
    http<{ lat: number; lng: number }>(`/customer/requests/${requestId}/location/`),
}

export const notifApi = {
  list: (userId: string) => http<any[]>(`/notifications/?userId=${userId}`),
  markRead: (id: string) =>
    http(`/notifications/${id}/read/`, { method: 'PATCH' }),
  create: (body: any) =>
    http<{ id: string }>('/notifications/create/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}