import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

/* ============================================================
   API client — one fetch wrapper, one socket, one token store.
   The Vite dev proxy maps /api and /socket.io to the Fastify
   server; in prod the same paths sit behind the load balancer.
   ============================================================ */

const TOKEN_KEY = 'brivia-token'

// Absolute API origin for split deploys (SPA on Vercel + API on Render).
// Empty = same-origin: the Vite dev proxy locally, Fastify-served dist in prod.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
export const apiUrl = (path) => `${API_BASE}${path}`

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    setToken(null)
    if (!location.pathname.endsWith('/login')) {
      location.href = import.meta.env.BASE_URL + 'login'
    }
    throw new Error('Session expired')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

/**
 * Upload a file to Supabase Storage via a server-signed URL.
 * kind ∈ avatar|cover|resume|video|attachment|voice. Returns the public URL.
 */
export async function uploadFile(kind, file) {
  const ext = (file.name?.split('.').pop() || '').toLowerCase()
  const { uploadUrl, publicUrl } = await api('/uploads/sign', { method: 'POST', body: { kind, ext } })
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
    body: file,
  })
  if (!res.ok) throw new Error('Upload failed — try a smaller file')
  return publicUrl
}

/** Declarative GET hook — { data, loading, error, refresh }. */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const load = useCallback(() => {
    let alive = true
    setState((s) => ({ ...s, loading: s.data === null }))
    api(path)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message }))
    return () => {
      alive = false
    }
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, refresh: load }
}

/* ---------- realtime ---------- */
let socket = null

export function getSocket() {
  if (!getToken()) return null
  if (!socket) {
    socket = io(API_BASE || '/', { path: '/socket.io', auth: { token: getToken() } })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
