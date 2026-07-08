import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HERO_IMG from './assets/hero.png'
import { api, setToken } from './app/api.js'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const { token } = await api(path, { method: 'POST', body: form })
      setToken(token)
      navigate(mode === 'signup' ? '/onboarding' : '/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const demo = () => {
    setMode('login')
    setForm({ name: '', email: 'mohit@brivia.club', password: 'brivia123' })
    setError(null)
  }

  return (
    <div className="auth-page">
      {/* Left: brand + imagery */}
      <aside className="auth-aside" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="auth-aside-inner">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            The <span className="accent">B</span>rivia <span className="accent">C</span>lub
          </div>
          <h2 className="auth-tag">
            Swipe. <span className="red">Match.</span> Build
          </h2>
          <p className="auth-sub">
            Find your people. Build your team. Ship your next big thing — one swipe at a time.
          </p>
        </div>
      </aside>

      {/* Right: form */}
      <main className="auth-main">
        <div className="auth-card">
          <div className="brand auth-mobile-brand" onClick={() => navigate('/')}>
            The <span className="accent">B</span>rivia <span className="accent">C</span>lub
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="auth-hint">
            {mode === 'login'
              ? 'Log in to start matching with builders.'
              : 'Join the club and find your next co-founder.'}
          </p>

          <div className="auth-switch">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          <button className="oauth-btn" onClick={demo}>
            <span className="g">✦</span> Use the demo account
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  placeholder="Aarav Mehta"
                  required
                  value={form.name}
                  onChange={set('name')}
                />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@email.com"
                required
                value={form.email}
                onChange={set('email')}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}{' '}
              <span className="spark">✦</span>
            </button>
          </form>

          <p className="auth-foot">
            {mode === 'login' ? (
              <>
                New to the club?{' '}
                <button className="link" onClick={() => setMode('signup')}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already a member?{' '}
                <button className="link" onClick={() => setMode('login')}>
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
