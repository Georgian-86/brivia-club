import { Link, useLocation } from 'react-router-dom'
import { getToken } from './app/api.js'

/** Landing page for the email-verification link (API redirects here). */
export default function VerifyEmail() {
  const status = new URLSearchParams(useLocation().search).get('status')
  const ok = status === 'ok'

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="brand">
          The <span className="accent">B</span>rivia <span className="accent">C</span>lub
        </div>
        <div className={`status-badge${ok ? ' ok' : ''}`}>{ok ? '✓' : '✕'}</div>
        <h1 className="status-title">{ok ? 'Email verified.' : 'This link has expired.'}</h1>
        <p className="status-text">
          {ok
            ? 'Your profile now carries the verified badge — decks and matches trust it.'
            : 'Verification links last 24 hours. Log in and resend a fresh one from your profile.'}
        </p>
        <Link className="auth-submit status-cta" to={getToken() ? '/app' : '/login'}>
          {getToken() ? 'Open the club' : 'Log in'}
        </Link>
      </div>
    </div>
  )
}
