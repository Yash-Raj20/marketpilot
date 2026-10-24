const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000/api';

/**
 * Clean legacy localStorage token if present
 */
export function getToken(): string | null {
  return null;
}

export function setToken(_token: string | null) {
  try {
    localStorage.removeItem('mp_token');
  } catch {}
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
