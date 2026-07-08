import { useOutletContext } from 'react-router-dom'
import { AppIcon, Loading, PageHead, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 📂 Project Marketplace — post a project, AI recommends applicants */

const DIFF_TONE = { 'Beginner-friendly': 'ok', Intermediate: 'mid', Advanced: 'hot' }

export default function Projects() {
  const { save, isSaved, toast } = useOutletContext()
  const { data, loading, refresh } = useApi('/projects')

  if (loading || !data) return <Loading label="Loading the marketplace…" />

  const apply = async (p) => {
    await api(`/projects/${p.id}/apply`, { method: 'POST' })
    toast(`Applied to ${p.name.split(' — ')[0]} — the owner sees your AI fit-score first`, 'folder')
    refresh()
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Project Marketplace"
        title={<>Ship something <span className="red">real.</span></>}
        sub="Open roles on live projects — paid, equity, rev-share or pure open source. The AI ranks applicants by fit, not by who applied first."
        actions={
          <button className="btn btn-red" onClick={() => toast('Project creation form ships next sprint', 'plus')}>
            <AppIcon name="plus" size={15} /> Post a project
          </button>
        }
      />

      <div className="proj-grid">
        {data.projects.map((p) => (
          <article className="proj-card" key={p.id}>
            <div className="proj-banner" style={{ backgroundImage: `url(${p.banner})` }}>
              <span className={`proj-diff ${DIFF_TONE[p.difficulty]}`}>{p.difficulty}</span>
              <button
                className={`icon-btn proj-save${isSaved('project', p.id) ? ' active' : ''}`}
                onClick={() => save('project', p.id, 'Project saved')}
                aria-label="Save project"
              >
                <AppIcon name="save" size={15} />
              </button>
            </div>
            <div className="proj-body">
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>

              <div className="proj-facts">
                <span><AppIcon name="users" size={12} /> {p.roles.join(' · ')}</span>
                <span><AppIcon name="clock" size={12} /> {p.timeline}</span>
                <span>
                  <AppIcon name="briefcase" size={12} /> {p.pay}
                  {p.equity && ` · ${p.equity} equity`}
                </span>
              </div>

              <div className="pc-chips">
                {p.stack.map((s) => (
                  <span className="chip" key={s}>{s}</span>
                ))}
              </div>

              <div className="proj-foot">
                <span className="cell-person">
                  <img src={p.owner.img} alt="" />
                  {p.owner.name}
                  {p.owner.badges?.includes('verified') && <VerifiedTick small />}
                </span>
                <div className="proj-foot-right">
                  <span className="proj-apps">{p.applicants} applicants</span>
                  <button
                    className={`btn btn-sm ${p.applied ? 'btn-ghost' : 'btn-red'}`}
                    disabled={p.applied}
                    onClick={() => apply(p)}
                  >
                    {p.applied ? <><AppIcon name="check" size={13} /> Applied</> : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
