import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AppIcon, Loading, PageHead } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 📅 Events — RSVP re-ranks your deck around people going too */

const KINDS = ['All', 'Hackathon', 'Pitch Night', 'Tech Talk', 'Workshop', 'Jam Session']

export default function Events() {
  const { save, isSaved, toast } = useOutletContext()
  const [kind, setKind] = useState('All')
  const { data, loading, refresh } = useApi('/events')

  if (loading || !data) return <Loading label="Checking the radar…" />

  const events = kind === 'All' ? data.events : data.events.filter((e) => e.kind === kind)
  const featured = events.filter((e) => e.featured)
  const rest = events.filter((e) => !e.featured)

  const toggleRsvp = async (ev) => {
    const { rsvp } = await api(`/events/${ev.id}/rsvp`, { method: 'POST' })
    toast(
      rsvp ? `You're going to ${ev.name}! Deck now prioritizes attendees` : `RSVP cancelled — ${ev.name}`,
      rsvp ? 'calendar' : 'x'
    )
    refresh()
  }

  const EventCard = ({ ev, big }) => (
    <article className={`event-card${big ? ' big' : ''}`}>
      <div className="event-banner" style={{ backgroundImage: `url(${ev.img})` }}>
        <span className="event-kind">{ev.kind}</span>
        {ev.prize && <span className="event-prize"><AppIcon name="trophy" size={11} /> {ev.prize}</span>}
      </div>
      <div className="event-body">
        <div className="event-when">
          <AppIcon name="calendar" size={12} /> {ev.date}
          <em>·</em>
          <AppIcon name="pin" size={12} /> {ev.location}
        </div>
        <h3>{ev.name}</h3>
        <p>{ev.blurb}</p>
        <div className="event-foot">
          <span className="event-going">
            <AppIcon name="users" size={12} /> {ev.going.toLocaleString()} going
          </span>
          <div className="pc-btns">
            <button
              className={`icon-btn${isSaved('event', ev.id) ? ' active' : ''}`}
              onClick={() => save('event', ev.id, 'Event saved')}
              aria-label="Save event"
            >
              <AppIcon name="save" size={15} />
            </button>
            <button
              className="icon-btn"
              title="Invite your matches"
              onClick={() => toast('Invite sent to your matches', 'send')}
            >
              <AppIcon name="send" size={15} />
            </button>
            <button
              className={`btn btn-sm ${ev.rsvp ? 'btn-ghost' : 'btn-red'}`}
              onClick={() => toggleRsvp(ev)}
            >
              {ev.rsvp ? <><AppIcon name="check" size={13} /> Going</> : 'RSVP'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )

  return (
    <div className="pg">
      <PageHead
        kicker="Events"
        title={<>Where the club <span className="red">shows up.</span></>}
        sub="RSVP to an event and your deck re-ranks around people going to the same one — teams form before the doors open."
      />

      <div className="filter-row">
        {KINDS.map((k) => (
          <button key={k} className={`pill${kind === k ? ' active' : ''}`} onClick={() => setKind(k)}>
            {k}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <div className="event-featured">
          {featured.map((ev) => (
            <EventCard key={ev.id} ev={ev} big />
          ))}
        </div>
      )}

      <div className="card-grid three">
        {rest.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>
    </div>
  )
}
