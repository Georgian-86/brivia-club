import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { AppIcon, BlockHead, Loading, PersonCard, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 🚀🎸💻🎨 Hubs — one editorial framework, four dedicated matching
   pools. Config + people + teams all come from /api/hubs/:id. */

function HackathonExtras({ hub, toast }) {
  const [tab, setTab] = useState('teams')
  return (
    <section className="panel">
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
          {hub.teams.map((t) => (
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
                    <img key={m.name} src={m.img} alt={m.name} title={m.name} />
                  ))}
                </div>
                <span className="team-needs">
                  Needs: {t.looking.join(', ')} · {t.spots} spot{t.spots > 1 ? 's' : ''}
                </span>
              </div>
              <button
                className="btn btn-red btn-sm"
                onClick={() => toast(`Request sent to join ${t.name}`, 'users')}
              >
                Ask to join
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-block" onClick={() => toast('Team creation ships with team rooms (Phase 0 #4)', 'zap')}>
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
