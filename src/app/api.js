import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

/* ============================================================
   API client — one fetch wrapper, one socket, one token store.
   The Vite dev proxy maps /api and /socket.io to the Fastify
   server; in prod the same paths sit behind the load balancer.
   ============================================================ */

const TOKEN_KEY = 'brivia-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
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
    socket = io('/', { path: '/socket.io', auth: { token: getToken() } })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
