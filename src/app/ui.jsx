import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BADGES, byId } from './appData.js'

/* ============================================================
   Shared in-app primitives — icons, page heads, person cards,
   match rings, chips, badges. One visual language everywhere.
   ============================================================ */

/* ---------- icon set (24px stroke grid, currentColor) ---------- */
const P = {
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  cards: <><rect x="7" y="3.5" width="11" height="15.5" rx="2" /><path d="M6.2 7.1l-2 .7a2 2 0 0 0-1.2 2.6l3.4 9.2a2 2 0 0 0 2.6 1.2l5.6-2.1" /></>,
  chat: <><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" /><path d="M8 9.5h8M8 13h5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  rocket: <><path d="M12 15.5c5.5-4 7-8.5 7-12 -3.5 0-8 1.5-12 7l-3.5 1 3 3z" /><path d="M8.5 15.5l-2 5 5-2" /><circle cx="14" cy="9.5" r="1.6" /></>,
  zap: <path d="M13 2.5L5 13.5h5.5L10 21.5l8.5-11.5h-5.5z" />,
  music: <><path d="M9 18.5V5.8l10-2.3v12.7" /><circle cx="6.6" cy="18.5" r="2.4" /><circle cx="16.6" cy="16.2" r="2.4" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2.2-.8 2.2-1.9 0-1-.7-1.5-.7-2.4 0-1 .8-1.8 2-1.8h1.8A3.7 3.7 0 0 0 21 11.3C21 6.7 17 3 12 3z" /><circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="12.5" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="7" cy="13.5" r="1" fill="currentColor" stroke="none" /></>,
  users: <><circle cx="9" cy="8.5" r="3.1" /><path d="M3.6 19.5c.6-3.1 2.8-4.9 5.4-4.9s4.8 1.8 5.4 4.9" /><circle cx="16.8" cy="9.6" r="2.5" /><path d="M16 14.7c2.3.2 4 1.7 4.5 4.2" /></>,
  folder: <><path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></>,
  briefcase: <><rect x="3.5" y="7.8" width="17" height="12.2" rx="2" /><path d="M9 7.8V6.3A2.3 2.3 0 0 1 11.3 4h1.4A2.3 2.3 0 0 1 15 6.3v1.5" /><path d="M3.5 12.8h17" /><path d="M12 11.4v2.8" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /><path d="M8 14h3M8 17h5" /></>,
  bot: <><rect x="5" y="8" width="14" height="10.5" rx="3" /><path d="M12 8V4.5M9.5 4.5h5" /><circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" /><path d="M9.5 15.7h5" /></>,
  chart: <><path d="M4 4v16h16" /><path d="M8.5 15.5v-4M12.5 15.5V8M16.5 15.5v-6.5" /></>,
  trophy: <><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 5.5H5a3 3 0 0 0 3 4.5M16 5.5h3a3 3 0 0 1-3 4.5" /><path d="M12 14v3.5M8.5 20.5h7M12 17.5c-1.6 0-2.8 1.2-3.5 3h7c-.7-1.8-1.9-3-3.5-3z" /></>,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  bell: <><path d="M18 15.5H6c1.2-1.2 1.8-2.2 1.8-5A4.2 4.2 0 0 1 12 6.2a4.2 4.2 0 0 1 4.2 4.3c0 2.8.6 3.8 1.8 5z" /><path d="M10.3 18.5a1.8 1.8 0 0 0 3.4 0" /><path d="M12 4v2.2" /></>,
  gem: <><path d="M7 4h10l4 5.5-9 11-9-11z" /><path d="M3 9.5h18M12 20.5L8.5 9.5 12 4l3.5 5.5z" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.4M12 18.1v2.4M3.5 12h2.4M18.1 12h2.4M6 6l1.7 1.7M16.3 16.3L18 18M18 6l-1.7 1.7M7.7 16.3L6 18" /></>,
  shield: <><path d="M12 3l7 2.8v5.1c0 4.6-3 7.7-7 9.6-4-1.9-7-5-7-9.6V5.8z" /><path d="M9.3 12l2 2 3.6-4.2" /></>,
  heart: <path d="M12 20s-7.5-4.7-7.5-10A4.4 4.4 0 0 1 9 5.6c1.3 0 2.4.7 3 1.7a3.6 3.6 0 0 1 3-1.7 4.4 4.4 0 0 1 4.5 4.4c0 5.3-7.5 10-7.5 10z" />,
  save: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
  flame: <path d="M12 3.5c.5 3-1 4.4-2.4 6C8.2 11 7 12.6 7 15a5 5 0 0 0 10 0c0-1.7-.7-3-1.6-4.2-.4 1-1 1.6-1.9 2.2.3-3.6-.8-7-1.5-9.5z" />,
  play: <path d="M8.5 5.5l10 6.5-10 6.5z" />,
  video: <><rect x="3.5" y="6.5" width="12" height="11" rx="2" /><path d="M15.5 11l5-3v8l-5-3" /></>,
  mic: <><rect x="9.3" y="3.5" width="5.4" height="10" rx="2.7" /><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" /></>,
  send: <path d="M4 11.5L20 4l-4.5 16.5-4-6.5z M11.5 14L20 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  eye: <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.5 2.5" /></>,
  pin: <><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11z" /><circle cx="12" cy="9.8" r="2.2" /></>,
  book: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21z" /><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  git: <><circle cx="6.5" cy="6.5" r="2.2" /><circle cx="6.5" cy="17.5" r="2.2" /><circle cx="17.5" cy="9" r="2.2" /><path d="M6.5 8.7v6.6M15.4 10.3c-2.4 1.8-6 1.4-6.8 4.5" /></>,
  camera: <><rect x="3.5" y="7" width="17" height="13" rx="2.5" /><path d="M8.5 7l1.5-2.5h4L15.5 7" /><circle cx="12" cy="13.2" r="3.4" /></>,
  gamepad: <><path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.7 3.4a2.7 2.7 0 0 1-4.8 1L14.5 16h-5l-1.4 1.8a2.7 2.7 0 0 1-4.8-1l-.7-3.4A4.5 4.5 0 0 1 7 8z" /><path d="M8.2 11v3M6.7 12.5h3" /><circle cx="15.6" cy="11.4" r=".9" fill="currentColor" stroke="none" /><circle cx="17.6" cy="13.2" r=".9" fill="currentColor" stroke="none" /></>,
  crown: <path d="M4 17.5L3 7l5 3.5L12 4l4 6.5L21 7l-1 10.5z" />,
  doc: <><path d="M6.5 3.5h8L19 8v12.5H6.5z" /><path d="M14 3.5V8.5H19M9.5 13h5M9.5 16.5h5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 6 .4l2.5-2.5a4 4 0 1 0-5.7-5.7l-1.3 1.3" /><path d="M14 10a4 4 0 0 0-6-.4l-2.5 2.5a4 4 0 1 0 5.7 5.7l1.3-1.3" /></>,
  logout: <><path d="M14 6V4.5H4.5v15H14V18" /><path d="M9.5 12h11M17 8.5l3.5 3.5-3.5 3.5" /></>,
  sparkle: <path d="M12 3l1.8 5.7L19.5 10l-5.7 1.8L12 17.5l-1.8-5.7L4.5 10l5.7-1.3z" />,
}

export function AppIcon({ name, size }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      {P[name] || P.sparkle}
    </svg>
  )
}

/* ---------- page head (kicker + serif title) ---------- */
export function PageHead({ kicker, title, sub, actions }) {
  return (
    <header className="pg-head">
      <div>
        <div className="pg-kicker">
          <span className="pg-kicker-line" />
          {kicker}
        </div>
        <h1 className="pg-title">{title}</h1>
        {sub && <p className="pg-sub">{sub}</p>}
      </div>
      {actions && <div className="pg-actions">{actions}</div>}
    </header>
  )
}

/* ---------- match ring — conic gauge around a % ---------- */
export function MatchRing({ value, size = 54 }) {
  return (
    <div
      className="ring"
      style={{ width: size, height: size, '--pct': `${value * 3.6}deg` }}
      title={`${value}% compatibility`}
    >
      <span>{value}%</span>
    </div>
  )
}

/* ---------- badges ---------- */
export function BadgeChip({ id }) {
  const b = BADGES[id]
  if (!b) return null
  return (
    <span className={`badge-chip b-${id}`} title={b.hint}>
      <AppIcon name={b.icon} size={12} />
      {b.label}
    </span>
  )
}

export function VerifiedTick({ small }) {
  return (
    <span className={`vtick${small ? ' sm' : ''}`} title="Verified builder">
      <AppIcon name="check" size={small ? 8 : 10} />
    </span>
  )
}

/* ---------- person card (grid unit used across hubs/search/home) ---------- */
export function PersonCard({ person, note, action, onSave, saved }) {
  const p = typeof person === 'string' ? byId(person) : person
  if (!p) return null
  return (
    <article className="person-card">
      <div className="pc-top">
        <div className="pc-ava-wrap">
          <img className="pc-ava" src={p.img} alt="" loading="lazy" />
          {p.online && <span className="pc-online" title="Online now" />}
        </div>
        <MatchRing value={p.match} size={46} />
      </div>
      <h3 className="pc-name">
        {p.name}
        {p.badges?.includes('verified') && <VerifiedTick small />}
      </h3>
      <div className="pc-role">{p.role} · {p.org}</div>
      <p className="pc-note">{note || p.bio}</p>
      <div className="pc-chips">
        {p.skills.slice(0, 3).map((s) => (
          <span className="chip" key={s}>{s}</span>
        ))}
      </div>
      <div className="pc-foot">
        <span className="pc-meta">
          <AppIcon name="pin" size={12} /> {p.location}
        </span>
        <div className="pc-btns">
          {onSave && (
            <button
              className={`icon-btn${saved ? ' active' : ''}`}
              onClick={() => onSave(p.id)}
              aria-label={saved ? 'Remove from saved' : 'Save'}
              title={saved ? 'Saved' : 'Save for later'}
            >
              <AppIcon name="save" size={15} />
            </button>
          )}
          {action}
        </div>
      </div>
    </article>
  )
}

/* ---------- small stat tile ---------- */
export function StatTile({ label, value, delta, delay = 0 }) {
  return (
    <div className="stat-tile" style={{ animationDelay: `${delay}ms` }}>
      <div className="st-value">{value}</div>
      <div className="st-label">{label}</div>
      {delta && <div className="st-delta">{delta}</div>}
    </div>
  )
}

/* ---------- section label inside a page ---------- */
export function BlockHead({ icon, title, action, to }) {
  return (
    <div className="block-head">
      <h2>
        {icon && <AppIcon name={icon} size={15} />}
        {title}
      </h2>
      {to ? (
        <Link className="block-link" to={to}>
          {action || 'View all'} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        action && <div>{action}</div>
      )}
    </div>
  )
}

/* ---------- loading state ---------- */
export function Loading({ label = 'Dealing the cards…' }) {
  return (
    <div className="pg-loading" role="status">
      <span className="pg-loading-spark">✦</span>
      {label}
    </div>
  )
}

/* ---------- toast (fire-and-forget confirmation) ---------- */
export function Toast({ toast, clear }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clear, 2600)
    return () => clearTimeout(t)
  }, [toast, clear])
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <AppIcon name={toast.icon || 'check'} size={15} />
      {toast.text}
    </div>
  )
}
