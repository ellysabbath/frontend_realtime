export type UserRole = 'customer' | 'technician' | 'owner' | 'admin'

export interface Session {
  userId: string
  fullName: string
  phone: string
  role: UserRole
}

const KEY = 'tapp_session'
const MAX_LENGTH = 4096

function isRole(value: unknown): value is UserRole {
  return (
    value === 'customer' ||
    value === 'technician' ||
    value === 'owner' ||
    value === 'admin'
  )
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    if (raw.length > MAX_LENGTH) {
      localStorage.removeItem(KEY)
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    if (typeof obj.userId !== 'string' || obj.userId.length === 0) return null
    return {
      userId: obj.userId,
      fullName: typeof obj.fullName === 'string' ? obj.fullName : '',
      phone: typeof obj.phone === 'string' ? obj.phone : '',
      role: isRole(obj.role) ? obj.role : 'customer',
    }
  } catch {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    return null
  }
}

export function setSession(input: Session): void {
  const clean: Session = {
    userId: String(input.userId || '').slice(0, 128),
    fullName: String(input.fullName || '').slice(0, 120),
    phone: String(input.phone || '').slice(0, 32),
    role: isRole(input.role) ? input.role : 'customer',
  }
  const payload = JSON.stringify(clean)
  try {
    localStorage.removeItem(KEY)
    localStorage.setItem(KEY, payload)
  } catch {
    try {
      localStorage.removeItem(KEY)
      localStorage.setItem(KEY, payload)
    } catch { /* ignore */ }
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}