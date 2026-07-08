import { Link, useOutletContext } from 'react-router-dom'
import { AppIcon, BlockHead, Loading, MatchRing, PersonCard, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 🏠 Home dashboard — the AI-personalized feed after login */

function RequestRow({ req, onAct }) {
  const p = req.person
  return (
    <div className="req-row">
      <img src={p.img} alt="" />
      <div className="req-body">
        <strong>
          {p.name} {p.badges?.includes('verified') && <VerifiedTick small />}
        </strong>
        <span>{p.role} · {p.org}</span>
        <p>“{req.note}”</p>
      </div>
      <div className="req-actions">
        <button className="btn btn-red btn-sm" onClick={() => onAct(req, true)}>
          Accept
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onAct(req, false)}>
          Pass
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const { save, isSaved, toast } = useOutletContext()
  const { data, loading, refresh } = useApi('/home')

  if (loading || !data) return <Loading label="Personalizing your dashboard…" />

  const actRequest = async (req, accepted) => {
    await api(`/requests/${req.id}/respond`, { method: 'POST', body: { accept: accepted } })
    toast(
      accepted ? `You're now connected with ${req.person.name}` : 'Request dismissed',
      accepted ? 'heart' : 'x'
    )
    refresh()
  }
  const actInvite = async (inv, accepted) => {
    await api(`/invitations/${inv.id}/respond`, { method: 'POST', body: { accept: accepted } })
    toast(accepted ? `Joined — ${inv.title}` : 'Invitation declined', accepted ? 'users' : 'x')
    refresh()
  }
  const connect = async (p) => {
    await api('/requests', { method: 'POST', body: { toId: p.id } })
    toast(`Connection request sent to ${p.name}`, 'heart')
  }

  return (
    <div className="pg">
      {/* greeting hero */}
      <section className="home-hero">
        <div className="orb orb-1" aria-hidden="true" />
        <div className="home-hero-copy">
          <div className="pg-kicker">
            <span className="pg-kicker-line" />
            Your day at the club
          </div>
          <h1 className="pg-title">
            Good morning, <span className="red">{data.firstName}.</span>
          </h1>
          <p className="pg-sub">
            The engine re-scored your network overnight — {data.recommended.length} new
            high-compatibility builders, {data.stats.pendingRequests} connection request
            {data.stats.pendingRequests === 1 ? '' : 's'} and {data.stats.invitations} open
            invitation{data.stats.invitations === 1 ? '' : 's'} waiting.
          </p>
          <div className="home-hero-cta">
            <Link to="/app/discover" className="btn btn-red">
              <AppIcon name="cards" size={15} /> Open today's deck
            </Link>
            <Link to="/app/assistant" className="btn btn-ghost">
              <AppIcon name="bot" size={15} /> Ask the AI
            </Link>
          </div>
        </div>
        <div className="home-hero-stats">
          {[
            [data.stats.topMatch ? `${data.stats.topMatch}%` : '—', 'top match today'],
            [data.stats.pendingRequests, 'pending requests'],
            [data.stats.invitations, 'active invitations'],
            [`${data.profileStrength}%`, 'profile strength'],
          ].map(([v, l]) => (
            <div key={l}>
              <strong>{v}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="home-grid">
        {/* main column */}
        <div className="home-col">
          <section className="panel">
            <BlockHead icon="sparkle" title="AI recommended for you" to="/app/discover" action="Open deck" />
            <p className="panel-hint">
              Ranked on skills, goals, availability and timezone — not follower counts.
            </p>
            <div className="card-grid two">
              {data.recommended.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  onSave={(id) => save('person', id)}
                  saved={isSaved('person', p.id)}
                  action={
                    <button className="btn btn-red btn-sm" onClick={() => connect(p)}>
                      Connect
                    </button>
                  }
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <BlockHead icon="users" title="Pending connection requests" />
            {data.requests.length === 0 ? (
              <p className="empty-note">All caught up — no pending requests.</p>
            ) : (
              data.requests.map((r) => <RequestRow key={r.id} req={r} onAct={actRequest} />)
            )}
          </section>

          <section className="panel">
            <BlockHead icon="zap" title="Project & team invitations" />
            {data.invitations.length === 0 ? (
              <p className="empty-note">No open invitations right now.</p>
            ) : (
              data.invitations.map((inv) => (
                <div className="invite-row" key={inv.id}>
                  <span className="invite-ic">
                    <AppIcon name={inv.icon} size={16} />
                  </span>
                  <div className="invite-body">
                    <span className="invite-kind">{inv.kind} invitation</span>
                    <strong>{inv.title}</strong>
                    <span className="invite-detail">
                      {inv.detail} · from {inv.from.name}
                    </span>
                  </div>
                  <div className="req-actions">
                    <button className="btn btn-red btn-sm" onClick={() => actInvite(inv, true)}>
                      Accept
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => actInvite(inv, false)}>
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        {/* rail */}
        <div className="home-rail">
          <section className="panel">
            <BlockHead icon="flame" title="Trending communities" to="/app/communities" />
            {data.trending.map((c) => (
              <Link to="/app/communities" className="mini-row" key={c.id}>
                <span className="mini-ic">
                  <AppIcon name={c.icon} size={15} />
                </span>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.members.toLocaleString()} members · {c.posts} posts/wk</span>
                </div>
                <span className="mini-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </section>

          <section className="panel">
            <BlockHead icon="calendar" title="Upcoming events" to="/app/events" />
            {data.events.map((ev) => (
              <Link to="/app/events" className="mini-row" key={ev.id}>
                <span className="mini-date">
                  {ev.date.split(' ')[0]}
                  <em>{ev.date.split(' ')[1]?.split('–')[0]}</em>
                </span>
                <div>
                  <strong>{ev.name}</strong>
                  <span>{ev.kind} · {ev.going.toLocaleString()} going</span>
                </div>
                <span className="mini-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </section>

          {data.topMatch && (
            <section className="panel rail-match">
              <BlockHead icon="heart" title="Your strongest match" />
              <div className="rail-match-body">
                <img src={data.topMatch.person.img} alt="" />
                <MatchRing value={data.topMatch.score} size={50} />
              </div>
              <strong>{data.topMatch.person.name}</strong>
              <span>{data.topMatch.person.role} · {data.topMatch.person.org}</span>
              <Link to={`/app/messages/${data.topMatch.matchId}`} className="btn btn-red btn-sm btn-block">
                <AppIcon name="chat" size={14} /> Continue the chat
              </Link>
            </section>
          )}

          <section className="panel rail-strength">
            <BlockHead icon="chart" title="Profile strength" to="/app/analytics" action="Details" />
            <div className="strength-bar">
              <span style={{ width: `${data.profileStrength}%` }} />
            </div>
            <p className="panel-hint">
              {data.profileStrength}% — add a video intro to reach the top decile of decks.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
