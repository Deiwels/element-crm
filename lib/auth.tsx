'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ApiError } from './api'
import type { User } from './roles'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://element-crm-api-431945333485.us-central1.run.app'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => {}, logout: async () => {}, refresh: async () => {},
})

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ELEMENT_TOKEN') || '' : ''
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { error: text } }
  if (!res.ok) throw new ApiError(res.status, data?.error || `HTTP ${res.status}`)
  return data as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/me')
      setUser(data.user)
      // Sync to localStorage
      if (data.user) localStorage.setItem('ELEMENT_USER', JSON.stringify(data.user))
    } catch {
      setUser(null)
      localStorage.removeItem('ELEMENT_TOKEN')
      localStorage.removeItem('ELEMENT_USER')
    } finally {
      setLoading(false)
    }
  }

  async function login(username: string, password: string) {
    const data = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    // Save token to localStorage for Bearer auth
    localStorage.setItem('ELEMENT_TOKEN', data.token)
    localStorage.setItem('ELEMENT_USER', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }) } catch {}
    localStorage.removeItem('ELEMENT_TOKEN')
    localStorage.removeItem('ELEMENT_USER')
    setUser(null)
    window.location.href = '/signin'
  }

  useEffect(() => {
    // Try to restore from localStorage first for instant load
    const stored = localStorage.getItem('ELEMENT_USER')
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    refresh()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
