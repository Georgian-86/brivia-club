import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AppIcon, Button, Overlay, SkeletonGrid, PageHead, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 📂 Project Marketplace — post a project, AI recommends applicants */

const DIFF_TONE = { 'Beginner-friendly': 'ok', Intermediate: 'mid', Advanced: 'hot' }
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=70'

function NewProjectModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState({ name: '', blurb: '', roles: '', stack: '', timeline: '', difficulty: 'Intermediate', pay: '', equity: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) return toast('Give your project a name', 'x')
    setBusy(true)
    try {
      const { project } = await api('/projects', { method: 'POST', body: { ...form, banner: DEFAULT_BANNER } })
      toast('Project posted — applicants will be ranked by AI fit', 'folder')
      onCreated(project)
      onClose()
    } catch (e) {
      toast(e.message, 'x')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Overlay onClose={onClose} label="Post a project">
      <div className="pe-box" role="dialog" aria-modal="true" aria-label="Post a project" onClick={(e) => e.stopPropagation()}>
        <div className="pe-head">
          <h3>Post a project</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><AppIcon name="x" size={15} /></button>
        </div>
        <div className="pe-grid">
          <div className="pe-field full"><label htmlFor="np-name">Project name</label><input id="np-name" value={form.name} onChange={set('name')} placeholder="MedScan — AI triage for rural clinics" /></div>
          <div className="pe-field full"><label htmlFor="np-blurb">One-line pitch</label><textarea id="np-blurb" value={form.blurb} onChange={set('blurb')} placeholder="What are you building and why now?" /></div>
          <div className="pe-field"><label htmlFor="np-roles">Roles needed (comma-separated)</label><input id="np-roles" value={form.roles} onChange={set('roles')} placeholder="Backend, Designer, PM" /></div>
          <div className="pe-field"><label htmlFor="np-stack">Stack (comma-separated)</label><input id="np-stack" value={form.stack} onChange={set('stack')} placeholder="React, FastAPI, Postgres" /></div>
          <div className="pe-field"><label htmlFor="np-timeline">Timeline</label><input id="np-timeline" value={form.timeline} onChange={set('timeline')} placeholder="6 weeks" /></div>
          <div className="pe-field">
            <label htmlFor="np-diff">Difficulty</label>
            <select id="np-diff" value={form.difficulty} onChange={set('difficulty')} className="pe-select">
              <option>Beginner-friendly</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
          <div className="pe-field"><label htmlFor="np-pay">Compensation</label><input id="np-pay" value={form.pay} onChange={set('pay')} placeholder="Unpaid · Side project" /></div>
          <div className="pe-field"><label htmlFor="np-equity">Equity (optional)</label><input id="np-equity" value={form.equity} onChange={set('equity')} placeholder="e.g. 2%" /></div>
        </div>
        <div className="pe-actions">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="btn btn-red" loading={busy} onClick={submit}>Post project</Button>
        </div>
      </div>
    </Overlay>
  )
}

export default function Projects() {
  const { save, isSaved, toast } = useOutletContext()
  const { data, loading, refresh } = useApi('/projects')
  const [creating, setCreating] = useState(false)

  if (loading || !data) return <SkeletonGrid count={6} cols="two" label="Loading the marketplace…" />

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
          <button className="btn btn-red" onClick={() => setCreating(true)}>
            <AppIcon name="plus" size={15} /> Post a project
          </button>
        }
      />

      {creating && <NewProjectModal toast={toast} onClose={() => setCreating(false)} onCreated={() => refresh()} />}

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
