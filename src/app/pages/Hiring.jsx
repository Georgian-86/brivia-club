import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AppIcon, Loading, PageHead } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 💼 Hiring — companies, startups, freelance, internships, equity roles */

const TYPES = ['All', 'Equity + salary', 'Full-time', 'Internship', 'Freelance', 'Part-time']

export default function Hiring() {
  const { save, isSaved, toast } = useOutletContext()
  const [type, setType] = useState('All')
  const { data, loading, refresh } = useApi('/jobs')

  if (loading || !data) return <Loading label="Collecting open roles…" />

  const jobs = type === 'All' ? data.jobs : data.jobs.filter((j) => j.type === type)

  const apply = async (j) => {
    await api(`/jobs/${j.id}/apply`, { method: 'POST' })
    toast(`Applied to ${j.title} @ ${j.org} — profile + proof-of-work attached`, 'briefcase')
    refresh()
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Hiring"
        title={<>Work that <span className="red">wants you.</span></>}
        sub="Startups and companies hiring from the club — every application ships with your verified proof-of-work, and recruiters see AI-ranked fit."
        actions={
          <button className="btn btn-ghost" onClick={() => toast('Recruiter access requires a verified company account', 'shield')}>
            <AppIcon name="briefcase" size={15} /> Post a role
          </button>
        }
      />

      <div className="filter-row">
        {TYPES.map((t) => (
          <button key={t} className={`pill${type === t ? ' active' : ''}`} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="job-list">
        {jobs.map((j) => (
          <article className="job-row" key={j.id}>
            <div className="job-org" aria-hidden="true">{j.org[0]}</div>
            <div className="job-body">
              <div className="job-title">
                <h3>{j.title}</h3>
                {j.hot && <span className="job-hot"><AppIcon name="flame" size={10} /> In demand</span>}
              </div>
              <span className="job-org-name">{j.org} · {j.type}</span>
              <div className="job-meta">
                <span><AppIcon name="pin" size={12} /> {j.mode}</span>
                <span><AppIcon name="gem" size={12} /> {j.pay}</span>
                <span><AppIcon name="clock" size={12} /> {j.posted} ago</span>
                <span><AppIcon name="users" size={12} /> {j.applicants} applied</span>
              </div>
              <div className="pc-chips">
                {j.tags.map((t) => (
                  <span className="chip" key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="job-actions">
              <button
                className={`icon-btn${isSaved('job', j.id) ? ' active' : ''}`}
                onClick={() => save('job', j.id, 'Job saved')}
                aria-label="Save job"
              >
                <AppIcon name="save" size={15} />
              </button>
              <button
                className={`btn btn-sm ${j.applied ? 'btn-ghost' : 'btn-red'}`}
                disabled={j.applied}
                onClick={() => apply(j)}
              >
                {j.applied ? <><AppIcon name="check" size={13} /> Applied</> : 'Apply'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
