import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { load, save } from './storage'
import { api, hasAPI } from './api'

export type Role = 'student' | 'teacher'
export type User = {
  id: string
  name: string
  email?: string
  role: Role
}

type AuthContextType = {
  user: User | null
  login: (u: { name: string; email?: string; role: Role; password?: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = 'user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => load<User | null>(USER_KEY, null))

  useEffect(() => {
    save(USER_KEY, user)
  }, [user])

  async function login(u: { name: string; email?: string; role: Role; password?: string }) {
    if (hasAPI() && u.email) {
      try {
        const serverUser = await api.login(u.email, u.password || '')
        setUser({ id: serverUser.id, name: serverUser.name, email: serverUser.email, role: serverUser.role })
        return
      } catch (e) {
        console.warn('API login failed', e)
        throw e
      }
    }
    // Fallback only if API disabled (demo mode)
    setUser({ id: `${u.role}-demo`, name: u.name, email: u.email, role: u.role })
  }

  const value = useMemo<AuthContextType>(() => ({ user, login, logout: () => setUser(null) }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
