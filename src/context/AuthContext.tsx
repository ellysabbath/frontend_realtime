import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi, getToken, setToken, clearToken } from '../lib/api'

export type UserRole = 'customer' | 'technician' | 'owner' | 'admin'

export interface AuthUser {
  userId: string
  fullName: string
  phone: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SESSION_KEY = 'tapp_session'

function isRole(v: unknown): v is UserRole {
  return v === 'customer' || v === 'technician' || v === 'owner' || v === 'admin'
}

function buildUser(userId: string, raw: Record<string, unknown>): AuthUser {
  return {
    userId: String(userId || ''),
    fullName: typeof raw.fullName === 'string' ? raw.fullName : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    role: isRole(raw.role) ? raw.role : 'customer',
  }
}

// Safe save that strips everything except the 4 required fields
function saveSession(user: AuthUser) {
  const clean = {
    userId: user.userId,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(clean))
  } catch (err) {
    console.warn('[Auth] Could not save session to localStorage:', err)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.userId) return null
    return buildUser(parsed.userId, parsed)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    // If we have a token, validate it and refresh the user
    authApi
      .me(token)
      .then((res) => {
        const raw = (res.user ?? {}) as Record<string, unknown>
        const freshUser = buildUser(res.userId, raw)
        setUser(freshUser)
        saveSession(freshUser)
      })
      .catch(() => {
        clearToken()
        setUser(null)
        try {
          localStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = (input: AuthUser, token: string) => {
    setToken(token)
    const freshUser = {
      userId: String(input.userId || ''),
      fullName: String(input.fullName || ''),
      phone: String(input.phone || ''),
      role: isRole(input.role) ? input.role : 'customer',
    }
    setUser(freshUser)
    saveSession(freshUser)
  }

  const logout = () => {
    const token = getToken()
    if (token) authApi.logout(token).catch(() => {})
    clearToken()
    setUser(null)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}