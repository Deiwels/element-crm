const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

export { API, API_KEY }

export async function apiFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ELEMENT_TOKEN') || '' : ''
  const res = await fetch(API + path, {
    credentials: 'include',
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-API-KEY': API_KEY,
      ...(opts?.headers || {}),
    },
  })
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !path.includes('/auth/login')) {
      localStorage.removeItem('ELEMENT_TOKEN')
      // If PIN is set up, show PIN screen instead of full logout
      if (localStorage.getItem('ELEMENT_PIN_HASH')) {
        window.dispatchEvent(new CustomEvent('element-pin-required'))
      } else {
        localStorage.removeItem('ELEMENT_USER')
        window.location.href = '/signin'
      }
    }
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}
