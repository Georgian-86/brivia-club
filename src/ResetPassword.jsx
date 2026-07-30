import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, setToken } from './app/api.js'

/** Landing page for the password-reset email link (?token=…). */
export default function ResetPassword() {
  const navigate = useNavigate()
  const token = new URLSearchParams(useLocation().search).get('token')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setError(null)
    setBusy(true)
    try {
      const { token: session } = await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password: form.password },
      })
      setToken(session)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="brand">
          The <span className="accent">B</span>rivia <span className="accent">C</span>lub
        </div>
        {!token ? (
          <>
            <h1 className="status-title">Missing reset link.</h1>
            <p className="status-text">
              Open the link from your email, or request a new one from the log-in page.
            </p>
            <Link className="auth-submit status-cta" to="/login">
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <h1 className="status-title">Choose a new password.</h1>
            <form onSubmit={submit} className="status-form">
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? 'One moment…' : 'Set password & log in'} <span className="spark">✦</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
