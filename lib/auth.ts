'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, ApiError } from './api'
import type { User } from './roles'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(username: string, password: string) {
    const data = await api.post<{ user: User; token: string }>('/api/auth/login', { username, password })
    setUser(data.user)
  }

  async function logout() {
    try { await api.post('/api/auth/logout', {}) } catch {}
    setUser(null)
    window.location.href = '/signin'
  }

  useEffect(() => { refresh() }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
