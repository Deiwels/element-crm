export type Role = 'owner' | 'admin' | 'barber'

export interface User {
  uid: string
  username: string
  name: string
  role: Role
  barber_id?: string
  email?: string
}

export interface Permissions {
  canViewPayroll: boolean
  canViewSettings: boolean
  canViewPayments: boolean
  canManageBarbers: boolean
  canViewAllBookings: boolean
  canManageBookings: boolean
}

export const PERMISSIONS: Record<Role, Permissions> = {
  owner: {
    canViewPayroll: true,
    canViewSettings: true,
    canViewPayments: true,
    canManageBarbers: true,
    canViewAllBookings: true,
    canManageBookings: true,
  },
  admin: {
    canViewPayroll: false,
    canViewSettings: false,
    canViewPayments: true,
    canManageBarbers: false,
    canViewAllBookings: true,
    canManageBookings: true,
  },
  barber: {
    canViewPayroll: false,
    canViewSettings: false,
    canViewPayments: false,
    canManageBarbers: false,
    canViewAllBookings: false,
    canManageBookings: true,
  },
}

export function can(user: User | null, permission: keyof Permissions): boolean {
  if (!user) return false
  return PERMISSIONS[user.role]?.[permission] ?? false
}

export function isOwner(user: User | null) { return user?.role === 'owner' }
export function isAdmin(user: User | null) { return user?.role === 'admin' }
export function isBarber(user: User | null) { return user?.role === 'barber' }
export function isOwnerOrAdmin(user: User | null) { return user?.role === 'owner' || user?.role === 'admin' }
