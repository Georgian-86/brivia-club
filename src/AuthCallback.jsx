import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from './app/api.js'

/**
 * OAuth landing pad. The API redirects here with the session in the
 * URL *fragment* (#token=…) — fragments never reach server logs or
 * Referer headers, unlike query strings.
 */
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')
    if (!token) {
      navigate(`/login?error=${encodeURIComponent('Sign-in failed — please try again')}`, {
        replace: true,
      })
      return
    }
    setToken(token)
    const next = params.get('next')
    const isNew = params.get('newuser') === '1'
    const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : null
    navigate(dest || (isNew ? '/onboarding' : '/app'), { replace: true })
  }, [navigate])

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="brand">
          The <span className="accent">B</span>rivia <span className="accent">C</span>lub
        </div>
        <p className="status-text">Signing you in…</p>
      </div>
    </div>
  )
}
