import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppIcon, Toast } from './ui.jsx'
import { api, getSocket, getToken, setToken, disconnectSocket } from './api.js'

/* ============================================================
   App shell — auth guard, sidebar, topbar, live notifications.
   Pages receive { me, setMe, save, isSaved, toast } via context.
   ============================================================ */

const NAV = [
  {
    label: 'Club',
    items: [
      ['/app', 'home', 'Home', true],
      ['/app/discover', 'cards', 'Discover'],
      ['/app/messages', 'chat', 'Messages'],
      ['/app/search', 'search', 'Smart Search'],
      ['/app/assistant', 'bot', 'AI Assistant'],
    ],
  },
  {
    label: 'Hubs',
    items: [
      ['/app/hub/startup', 'rocket', 'Startup Hub'],
      ['/app/hub/hackathon', 'zap', 'Hackathon Hub'],
      ['/app/hub/music', 'music', 'Music Hub'],
      ['/app/hub/creator', 'palette', 'Creator Hub'],
    ],
  },
  {
    label: 'Explore',
    items: [
      ['/app/communities', 'users', 'Communities'],
      ['/app/projects', 'folder', 'Projects'],
      ['/app/hiring', 'briefcase', 'Hiring'],
      ['/app/events', 'calendar', 'Events'],
    ],
  },
  {
    label: 'You',
    items: [
      ['/app/analytics', 'chart', 'Analytics'],
      ['/app/saved', 'save', 'Saved'],
      ['/app/premium', 'gem', 'Premium'],
    ],
  },
]

function Sidebar({ open, close, me, msgUnread }) {
  const groups = useMemo(() => {
    if (me?.role !== 'ADMIN') return NAV
    return NAV.map((g) =>
      g.label === 'You' ? { ...g, items: [...g.items, ['/app/admin', 'gear', 'Admin']] } : g
    )
  }, [me])

  return (
    <>
      <aside className={`app-side${open ? ' open' : ''}`}>
        <Link to="/" className="brand app-brand">
          The <span className="accent">B</span>rivia <span className="accent">C</span>lub
        </Link>

        <nav className="side-nav">
          {groups.map((group) => (
            <div className="side-group" key={group.label}>
              <div className="side-label">{group.label}</div>
              {group.items.map(([to, icon, label, end]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
                  onClick={close}
                >
                  <AppIcon name={icon} size={17} />
                  <span>{label}</span>
                  {label === 'Messages' && msgUnread > 0 && (
                    <span className="side-count">{msgUnread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <Link to="/app/profile" className="side-me" onClick={close}>
          <img src={me?.avatar} alt="" />
          <div>
            <strong>{me?.name}</strong>
            <span>View profile</span>
          </div>
          <span className="side-me-strength" title={`Profile strength ${me?.profileStrength}%`}>
            {me?.profileStrength}%
          </span>
        </Link>
      </aside>
      {open && <div className="side-scrim" onClick={close} aria-hidden="true" />}
    </>
  )
}

const NOTIF_ICONS = {
  match: 'heart', message: 'chat', invite: 'users', project: 'folder',
  event: 'calendar', community: 'bot', badge: 'trophy',
}

const timeAgo = (at) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(at)) / 60e3))
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.round(mins / 60)}h`
  return `${Math.round(mins / 1440)}d`
}

function NotifDrawer({ open, close, items, markAll }) {
  return (
    <>
      <aside className={`notif-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="notif-head">
          <h2>
            <AppIcon name="bell" size={16} /> Notifications
          </h2>
          <div>
            <button className="text-btn" onClick={markAll}>Mark all read</button>
            <button className="icon-btn" onClick={close} aria-label="Close notifications">
              <AppIcon name="x" size={15} />
            </button>
          </div>
        </div>
        <div className="notif-list">
          {items.length === 0 && <p className="empty-note" style={{ padding: 14 }}>Quiet for now — go swipe.</p>}
          {items.map((n) => (
            <div className={`notif-item${!n.read ? ' unread' : ''}`} key={n.id}>
              {n.avatar ? (
                <img className="notif-ava" src={n.avatar} alt="" />
              ) : (
                <span className="notif-ic">
                  <AppIcon name={NOTIF_ICONS[n.kind] || 'bell'} size={15} />
                </span>
              )}
              <div>
                <p>{n.text}</p>
                <span>{timeAgo(n.at)} ago</span>
              </div>
              {!n.read && <span className="notif-dot" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </aside>
      {open && <div className="side-scrim" onClick={close} aria-hidden="true" />}
    </>
  )
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [me, setMe] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [savedKeys, setSavedKeys] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [q, setQ] = useState('')

  const authed = !!getToken()

  useEffect(() => {
    if (!authed) return
    api('/auth/me').then((d) => setMe(d.me)).catch(() => {})
    api('/notifications').then((d) => setNotifs(d.notifications)).catch(() => {})
    api('/saved').then((d) => setSavedKeys(new Set(d.keys))).catch(() => {})

    const socket = getSocket()
    const onNotif = (n) =>
      setNotifs((ns) => [{ id: n.id, kind: n.kind, text: n.text, read: false, at: n.createdAt }, ...ns])
    socket?.on('notification:new', onNotif)
    return () => socket?.off('notification:new', onNotif)
  }, [authed])

  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  const ctx = useMemo(
    () => ({
      me,
      setMe,
      isSaved: (type, refId) => savedKeys.has(`${type}:${refId}`),
      save: async (type, refId, label = 'Saved to your collection') => {
        const { saved } = await api(`/saved/${type}/${refId}`, { method: 'PUT' })
        setSavedKeys((keys) => {
          const next = new Set(keys)
          saved ? next.add(`${type}:${refId}`) : next.delete(`${type}:${refId}`)
          return next
        })
        setToast({ icon: 'save', text: saved ? label : 'Removed from saved' })
      },
      toast: (text, icon = 'check') => setToast({ text, icon }),
    }),
    [me, savedKeys]
  )

  if (!authed) return <Navigate to="/login" replace />

  const unread = notifs.filter((n) => !n.read).length
  const msgUnread = notifs.filter((n) => !n.read && n.kind === 'message').length

  const submitSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/app/search?q=${encodeURIComponent(q.trim())}`)
    setQ('')
  }

  const logout = () => {
    disconnectSocket()
    setToken(null)
    navigate('/login')
  }

  return (
    <div className="app-root">
      <Sidebar open={menuOpen} close={() => setMenuOpen(false)} me={me} msgUnread={msgUnread} />

      <div className="app-main">
        <header className="app-top">
          <button
            className="icon-btn app-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <AppIcon name="filter" size={17} />
          </button>

          <form className="top-search" onSubmit={submitSearch} role="search">
            <AppIcon name="search" size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try "guitarists in Bangalore" or "hackathon teammates"…'
              aria-label="Smart search"
            />
            <kbd>AI</kbd>
          </form>

          <div className="top-actions">
            <Link to="/app/premium" className="top-premium">
              <AppIcon name="gem" size={13} /> Premium
            </Link>
            <button
              className="icon-btn top-bell"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications — ${unread} unread`}
            >
              <AppIcon name="bell" size={17} />
              {unread > 0 && <span className="bell-count">{unread}</span>}
            </button>
            <Link to="/app/profile" className="top-ava" aria-label="Your profile">
              {me?.avatar && <img src={me.avatar} alt="" />}
            </Link>
            <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
              <AppIcon name="logout" size={16} />
            </button>
          </div>
        </header>

        <main className="app-page">
          <Outlet context={ctx} />
        </main>
      </div>

      <NotifDrawer
        open={notifOpen}
        close={() => setNotifOpen(false)}
        items={notifs}
        markAll={async () => {
          await api('/notifications/read-all', { method: 'POST' })
          setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))
        }}
      />
      <Toast toast={toast} clear={() => setToast(null)} />
    </div>
  )
}
