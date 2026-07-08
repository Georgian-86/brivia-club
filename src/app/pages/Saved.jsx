import { useOutletContext, Link } from 'react-router-dom'
import { AppIcon, Loading, PageHead, PersonCard } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* ⭐ Saved Collection — people, projects, events and jobs in one place */

export default function Saved() {
  const { save, isSaved, toast } = useOutletContext()
  const people = useApi('/search?q=')
  const projects = useApi('/projects')
  const jobs = useApi('/jobs')
  const events = useApi('/events')

  if (people.loading || projects.loading || jobs.loading || events.loading)
    return <Loading label="Opening your shelf…" />

  const savedPeople = (people.data?.results || []).filter((p) => isSaved('person', p.id))
  const savedProjects = (projects.data?.projects || []).filter((p) => isSaved('project', p.id))
  const savedJobs = (jobs.data?.jobs || []).filter((j) => isSaved('job', j.id))
  const savedEvents = (events.data?.events || []).filter((e) => isSaved('event', e.id))
  const empty = !savedPeople.length && !savedProjects.length && !savedJobs.length && !savedEvents.length

  const connect = async (p) => {
    await api('/requests', { method: 'POST', body: { toId: p.id } })
    toast(`Connection request sent to ${p.name}`, 'heart')
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Saved collection"
        title={<>Kept for <span className="red">later.</span></>}
        sub="Everything you starred across the club — people, projects, events and jobs, all in one shelf."
      />

      {empty && (
        <div className="panel empty-panel">
          <AppIcon name="save" size={26} />
          <h3>Nothing saved yet</h3>
          <p>Tap the bookmark on any card — profiles, projects, events or jobs land here.</p>
          <Link to="/app/discover" className="btn btn-red">Open today's deck</Link>
        </div>
      )}

      {savedPeople.length > 0 && (
        <section>
          <div className="block-head"><h2><AppIcon name="users" size={15} /> People ({savedPeople.length})</h2></div>
          <div className="card-grid three">
            {savedPeople.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                onSave={(pid) => save('person', pid)}
                saved
                action={
                  <button className="btn btn-red btn-sm" onClick={() => connect(p)}>
                    Connect
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {savedProjects.length > 0 && (
        <section>
          <div className="block-head"><h2><AppIcon name="folder" size={15} /> Projects ({savedProjects.length})</h2></div>
          <div className="saved-rows">
            {savedProjects.map((p) => (
              <div className="saved-row" key={p.id}>
                <span className="mini-ic"><AppIcon name="folder" size={15} /></span>
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.roles.join(' · ')} · {p.timeline} · {p.pay}</span>
                </div>
                <button className="icon-btn active" onClick={() => save('project', p.id)} aria-label="Remove">
                  <AppIcon name="save" size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {savedEvents.length > 0 && (
        <section>
          <div className="block-head"><h2><AppIcon name="calendar" size={15} /> Events ({savedEvents.length})</h2></div>
          <div className="saved-rows">
            {savedEvents.map((e) => (
              <div className="saved-row" key={e.id}>
                <span className="mini-ic"><AppIcon name="calendar" size={15} /></span>
                <div>
                  <strong>{e.name}</strong>
                  <span>{e.kind} · {e.date} · {e.location}</span>
                </div>
                <button className="icon-btn active" onClick={() => save('event', e.id)} aria-label="Remove">
                  <AppIcon name="save" size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {savedJobs.length > 0 && (
        <section>
          <div className="block-head"><h2><AppIcon name="briefcase" size={15} /> Jobs ({savedJobs.length})</h2></div>
          <div className="saved-rows">
            {savedJobs.map((j) => (
              <div className="saved-row" key={j.id}>
                <span className="mini-ic"><AppIcon name="briefcase" size={15} /></span>
                <div>
                  <strong>{j.title} · {j.org}</strong>
                  <span>{j.type} · {j.mode} · {j.pay}</span>
                </div>
                <button className="icon-btn active" onClick={() => save('job', j.id)} aria-label="Remove">
                  <AppIcon name="save" size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
