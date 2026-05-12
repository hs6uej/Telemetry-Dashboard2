function getBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001/api'
  // ใช้ hostname เดียวกับ frontend แต่ port 3001 — ทำงานได้ทุก server IP
  return `${window.location.protocol}//${window.location.hostname}:3001/api`
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${getBase()}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ access_token: string; user: { id: number; username: string; role: string } }>(
        '/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) },
      ),
    me: () => request('/auth/me'),
  },
  stations: {
    list: () => request<any[]>('/stations'),
    get: (id: number) => request<any>(`/stations/${id}`),
    create: (data: any) => request('/stations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/stations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/stations/${id}`, { method: 'DELETE' }),
  },
  readings: {
    latest: () => request<any[]>('/readings/latest'),
    get: (stationId: number, hours = 24) => request<any[]>(`/stations/${stationId}/readings?hours=${hours}`),
    add: (stationId: number, data: any) =>
      request(`/stations/${stationId}/readings`, { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    list: () => request<any[]>('/users'),
    create: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),
    approve: (id: number) => request(`/users/${id}/approve`, { method: 'POST' }),
    logs: () => request<any[]>('/users/logs'),
    clearLogs: () => request('/users/logs/clear', { method: 'DELETE' }),
  },
  configs: {
    list: () => request<any[]>('/configs'),
    create: (data: any) => request('/configs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/configs/${id}`, { method: 'DELETE' }),
    send: (id: number) => request(`/configs/${id}/send`, { method: 'POST' }),
  },
}
