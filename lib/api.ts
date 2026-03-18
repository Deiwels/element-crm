const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://element-crm-api-431945333485.us-central1.run.app'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    credentials: 'include', // sends httpOnly cookie automatically
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  })

  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { error: text } }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

export { ApiError }
