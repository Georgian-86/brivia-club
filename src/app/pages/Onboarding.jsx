import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppIcon } from '../ui.jsx'
import { PURPOSES } from '../appData.js'
import { api } from '../api.js'

/* Purpose selector — one choice personalizes the whole app,
   from swipe decks to communities to events. */

export default function Onboarding() {
  const navigate = useNavigate()
  const [picked, setPicked] = useState(() => new Set())
  const [leaving, setLeaving] = useState(false)

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const go = () => {
    setLeaving(true)
    // fire-and-forget — the animation shouldn't wait on the network
    api('/users/me', { method: 'PATCH', body: { purposes: [...picked] } }).catch(() => {})
    setTimeout(() => navigate('/app'), 450)
  }

  return (
    <div className={`onb-page${leaving ? ' leaving' : ''}`}>
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <Link to="/" className="brand onb-brand">
        The <span className="accent">B</span>rivia <span className="accent">C</span>lub
      </Link>

      <div className="onb-inner">
        <div className="pg-kicker" style={{ justifyContent: 'center' }}>
          <span className="pg-kicker-line" />
          Step 1 of 1 · Personalize
          <span className="pg-kicker-line flip" />
        </div>
        <h1 className="onb-title">
          What brings you to <span className="red">the club?</span>
        </h1>
        <p className="onb-sub">
          Pick one or more — this single choice tunes your decks, communities and events.
          You can change it anytime.
        </p>

        <div className="onb-grid">
          {PURPOSES.map((p, i) => {
            const on = picked.has(p.id)
            return (
              <button
                key={p.id}
                className={`onb-card${on ? ' on' : ''}`}
                onClick={() => toggle(p.id)}
                style={{ animationDelay: `${i * 60}ms` }}
                aria-pressed={on}
              >
                <span className="onb-ic"><AppIcon name={p.icon} size={19} /></span>
                <strong>{p.title}</strong>
                <span className="onb-text">{p.text}</span>
                <span className="onb-check" aria-hidden="true"><AppIcon name="check" size={12} /></span>
              </button>
            )
          })}
        </div>

        <div className="onb-actions">
          <button className="btn btn-red onb-go" disabled={picked.size === 0} onClick={go}>
            {picked.size === 0
              ? 'Pick at least one'
              : `Enter the club${picked.size > 1 ? ` · ${picked.size} picked` : ''}`}
            <span className="spark">✦</span>
          </button>
          <button className="text-btn" onClick={go}>Skip for now</button>
        </div>
      </div>
    </div>
  )
}
