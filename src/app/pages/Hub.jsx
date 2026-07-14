import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { AppIcon, BlockHead, Button, Loading, Overlay, PersonCard, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 🚀🎸💻🎨 Hubs — one editorial framework, four dedicated matching
   pools. Config + people come from /api/hubs/:id; teams are live. */

function NewTeamModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState({ name: '', event: '', looking: '', stack: '', spots: 3 })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const submit = async () => {
    if (!form.name.trim()) return toast('Give your team a name', 'x')
    setBusy(true)
    try {
      const { team } = await api('/teams', { method: 'POST', body: { ...form, hub: 'hackathon' } })
      toast(`Team ${team.name} created — you're the founder`, 'zap')
      onCreated()
      onClose()
    } catch (e) {
      toast(e.message, 'x')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Overlay onClose={onClose} label="Create a team">
      <div className="pe-box" role="dialog" aria-modal="true" aria-label="Create a team" onClick={(e) => e.stopPropagation()}>
        <div className="pe-head">
          <h3>Create a team</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><AppIcon name="x" size={15} /></button>
        </div>
        <div className="pe-grid">
          <div className="pe-field full"><label htmlFor="nt-name">Team name</label><input id="nt-name" value={form.name} onChange={set('name')} placeholder="AgriSense" /></div>
          <div className="pe-field full"><label htmlFor="nt-event">Event</label><input id="nt-event" value={form.event} onChange={set('event')} placeholder="Smart India Hackathon" /></div>
          <div className="pe-field"><label htmlFor="nt-looking">Roles needed (comma-separated)</label><input id="nt-looking" value={form.looking} onChange={set('looking')} placeholder="Designer, ML" /></div>
          <div className="pe-field"><label htmlFor="nt-stack">Stack (comma-separated)</label><input id="nt-stack" value={form.stack} onChange={set('stack')} placeholder="React, FastAPI" /></div>
          <div className="pe-field"><label htmlFor="nt-spots">Team size</label><input id="nt-spots" type="number" min="1" max="12" value={form.spots} onChange={set('spots')} /></div>
        </div>
        <div className="pe-actions">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="btn btn-red" loading={busy} onClick={submit}>Create team</Button>
        </div>
      </div>
    </Overlay>
  )
}

function HackathonExtras({ hub, toast }) {
  const [tab, setTab] = useState('teams')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(null)
  const { data, refresh } = useApi('/teams?hub=hackathon')
  const teams = data?.teams || []

  const join = async (t) => {
    setJoining(t.id)
    try {
      await api(`/teams/${t.id}/join`, { method: 'POST' })
      toast(`You joined ${t.name}`, 'users')
      refresh()
    } catch (e) {
      toast(e.message, 'x')
    } finally {
      setJoining(null)
    }
  }

  return (
    <section className="panel">
      {creating && <NewTeamModal toast={toast} onClose={() => setCreating(false)} onCreated={refresh} />}
      <div className="tab-row">
        <button className={`pill${tab === 'teams' ? ' active' : ''}`} onClick={() => setTab('teams')}>
          Open teams
        </button>
        <button className={`pill${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>
          Leaderboard
        </button>
        <button className={`pill${tab === 'organizer' ? ' active' : ''}`} onClick={() => setTab('organizer')}>
          Organizer side
        </button>
      </div>

      {tab === 'teams' && (
        <div className="team-list">
          {teams.length === 0 && <p className="empty-note">No open teams yet — be the first to create one.</p>}
          {teams.map((t) => (
            <div className="team-row" key={t.id}>
              <div className="team-body">
                <strong>{t.name}</strong>
                <span className="team-event">{t.event}</span>
                <div className="pc-chips">
                  {t.stack.map((s) => (
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="team-mid">
                <div className="avatars">
                  {t.members.map((m) => (
                    <img key={m.id} src={m.img} alt={m.name} title={m.name} />
                  ))}
                </div>
                <span className="team-needs">
                  {t.looking.length ? `Needs: ${t.looking.join(', ')} · ` : ''}
                  {t.spots} spot{t.spots === 1 ? '' : 's'} left
                </span>
              </div>
              {t.isMember ? (
                <button className="btn btn-ghost btn-sm" disabled>
                  <AppIcon name="check" size={13} /> {t.isOwner ? 'Founder' : 'Joined'}
                </button>
              ) : (
                <Button
                  className="btn btn-red btn-sm"
                  loading={joining === t.id}
                  disabled={t.spots === 0}
                  onClick={() => join(t)}
                >
                  {t.spots === 0 ? 'Full' : 'Ask to join'}
                </Button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-block" onClick={() => setCreating(true)}>
            <AppIcon name="plus" size={14} /> Create a team
          </button>
        </div>
      )}

      {tab === 'board' && (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Builder</th><th>Points</th><th>Verified wins</th></tr>
          </thead>
          <tbody>
            {hub.leaderboard.map((row) => (
              <tr key={row.rank}>
                <td className={`lb-rank r${row.rank}`}>{row.rank}</td>
                <td>
                  <span className="cell-person">
                    <img src={row.img} alt="" /> {row.name} <VerifiedTick small />
                  </span>
                </td>
                <td>{row.points.toLocaleString()}</td>
                <td>{row.wins} <AppIcon name="trophy" size={12} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'organizer' && (
        <div className="org-grid">
          {[
            ['calendar', 'Create event', 'Banner, timeline, registration link, FAQs'],
            ['users', 'Team matching', 'Every solo registrant gets a squad'],
            ['bell', 'Push notifications', 'Announcements straight to participants'],
            ['star', 'Featured placement', 'Promote your event across the club'],
            ['gem', 'Sponsors & mentors', 'Showcase partners on the event page'],
            ['chart', 'Organizer dashboard', 'Registrations, team-formation rate, live stats'],
          ].map(([icon, title, text]) => (
            <div className="org-card" key={title}>
              <span className="mini-ic"><AppIcon name={icon} size={15} /></span>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
          <button className="btn btn-red btn-block org-cta" onClick={() => toast('Organizer application submitted', 'calendar')}>
            <AppIcon name="calendar" size={14} /> Host your event on Brivia
          </button>
        </div>
      )}
    </section>
  )
}

export default function Hub() {
  const { hubId } = useParams()
  const { save, isSaved, toast } = useOutletContext()
  const [role, setRole] = useState(null)
  const { data: hub, loading } = useApi(`/hubs/${hubId}`, [hubId])

  if (loading || !hub) return <Loading label="Opening the hub…" />

  const connect = async (p) => {
    await api('/requests', { method: 'POST', body: { toId: p.id } })
    toast(`Connection request sent to ${p.name}`, 'heart')
  }

  return (
    <div className="pg" key={hubId}>
      {/* hub hero */}
      <section className={`hub-hero hub-${hubId}`}>
        <div className="orb orb-1" aria-hidden="true" />
        <span className="hub-ic"><AppIcon name={hub.icon} size={24} /></span>
        <div className="pg-kicker">
          <span className="pg-kicker-line" />
          {hub.kicker}
        </div>
        <h1 className="pg-title">
          {hub.title[0]} <span className="red">{hub.title[1]}</span>
        </h1>
        <p className="pg-sub">{hub.sub}</p>
        <div className="hub-stats">
          {hub.stats.map(([v, l]) => (
            <div key={l}>
              <strong>{v}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* looking-for selector feeds the hub's matching pool */}
      <section className="panel">
        <BlockHead icon="filter" title="I'm looking for" />
        <div className="filter-row wrap">
          {hub.roles.map((r) => (
            <button
              key={r}
              className={`pill${role === r ? ' active' : ''}`}
              onClick={() => setRole(role === r ? null : r)}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="panel-hint">
          {role
            ? `Deck re-ranked — surfacing ${role.toLowerCase()}s who complement your profile.`
            : 'Pick a role and the hub re-ranks its deck around that gap in your team.'}
        </p>
      </section>

      {hubId === 'hackathon' && hub.teams && <HackathonExtras hub={hub} toast={toast} />}

      <section>
        <BlockHead
          icon="sparkle"
          title={role ? `Top ${role.toLowerCase()} matches` : 'Recommended in this hub'}
          to="/app/discover"
          action="Open full deck"
        />
        {hub.people.length === 0 ? (
          <div className="panel empty-panel">
            <AppIcon name={hub.icon} size={26} />
            <h3>This pool is filling up</h3>
            <p>Nobody with this focus has joined yet — invite someone and claim the first-mover badge.</p>
          </div>
        ) : (
          <div className="card-grid three">
            {hub.people.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                onSave={(pid) => save('person', pid)}
                saved={isSaved('person', p.id)}
                action={
                  <button className="btn btn-red btn-sm" onClick={() => connect(p)}>
                    Connect
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      {hubId === 'music' && (
        <section className="panel music-extra">
          <BlockHead icon="music" title="Musician profiles carry more" />
          <div className="org-grid">
            {[
              ['music', 'Genres & influences', 'Indie, jazz, carnatic fusion — matched on taste'],
              ['video', 'Performance videos', 'Hear them before you meet them'],
              ['link', 'Spotify · YouTube · Instagram', 'Linked, verified, embedded'],
              ['clock', 'Practice schedule', 'Match on when you can actually jam'],
              ['star', 'Band experience', 'Past lineups and live-show history'],
              ['search', 'Looking for', 'Band members, jam partners, performers'],
            ].map(([icon, title, text]) => (
              <div className="org-card" key={title}>
                <span className="mini-ic"><AppIcon name={icon} size={15} /></span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
