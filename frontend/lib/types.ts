export interface Station {
  id: number
  name: string
  lat: number
  lng: number
  waterLevel: number | null
  rainLevel: number | null
  status: 'normal' | 'warning' | 'critical' | 'offline'
  leftBank: number | null
  rightBank: number | null
  bedData: string | null
  warningLevel: number | null
  createdAt: string
  updatedAt: string
}

export interface StationReading {
  time: string
  stationId: number
  waterLevel: number | null
  rainLevel: number | null
  flowRate: number | null
}

export interface User {
  id: number
  username: string
  role: 'admin' | 'user' | 'pending'
  approved: boolean
  passwordResetRequired: boolean
  createdAt: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: { id: number; username: string; role: string }
}

export const STATUS_LABEL: Record<string, string> = {
  normal: 'ปกติ',
  warning: 'เฝ้าระวัง',
  critical: 'วิกฤต',
  offline: 'ออฟไลน์',
}

export const STATUS_COLOR: Record<string, string> = {
  normal: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  offline: 'bg-slate-400',
}
