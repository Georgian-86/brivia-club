import { useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AppIcon, BadgeChip, BlockHead, Button, Loading, Overlay } from '../ui.jsx'
import { api, uploadFile, useApi } from '../api.js'

/* 👤 AI Builder Profile — renders the signed-in user from the API.
   One profile powers every feature; edits re-score you in the engine. */

const VERIFY_ITEMS = [
  ['email', 'Email', 'Confirm your inbox'],
  ['phone', 'Phone', 'OTP verification'],
  ['github', 'GitHub', 'OAuth-linked proof of work'],
  ['linkedin', 'LinkedIn', 'OAuth-linked identity'],
  ['college', 'College', 'Campus email or ID review'],
  ['company', 'Company', 'Verify with a work email'],
]

function Overview({ me, onRecordVideo }) {
  return (
    <div className="prof-grid">
      <div className="prof-col">
        <section className="panel">
          <BlockHead icon="doc" title="About" />
          <p className="prof-bio">{me.bio || 'Add a bio — it feeds the matching engine.'}</p>
          <div className="prof-facts">
            {me.location && <span><AppIcon name="pin" size={13} /> {me.location}</span>}
            {me.timezone && <span><AppIcon name="clock" size={13} /> {me.timezone}</span>}
            {me.availability && <span><AppIcon name="calendar" size={13} /> {me.availability}</span>}
            {me.workStyle && <span><AppIcon name="zap" size={13} /> {me.workStyle}</span>}
          </div>
        </section>

        <section className="panel">
          <BlockHead icon="briefcase" title="Experience" />
          {(me.experience || []).length === 0 && <p className="empty-note">No experience added yet.</p>}
          {(me.experience || []).map((e) => (
            <div className="xp-row" key={e.role}>
              <span className="xp-dot" aria-hidden="true" />
              <div>
                <strong>{e.role} · {e.org}</strong>
                <span className="xp-span">{e.span}</span>
                <p>{e.text}</p>
              </div>
            </div>
          ))}
          <BlockHead icon="book" title="Education" />
          {(me.education || []).length === 0 && <p className="empty-note">No education added yet.</p>}
          {(me.education || []).map((e) => (
            <div className="xp-row" key={e.school}>
              <span className="xp-dot" aria-hidden="true" />
              <div>
                <strong>{e.school}</strong>
                <span className="xp-span">{e.degree} · {e.span}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          <BlockHead icon="trophy" title="Achievements & certifications" />
          {(me.achievements || []).length + (me.certifications || []).length === 0 && (
            <p className="empty-note">Wins land here automatically once verified against event results.</p>
          )}
          <ul className="ach-list">
            {(me.achievements || []).map((a) => (
              <li key={a}><AppIcon name="trophy" size={13} /> {a}</li>
            ))}
            {(me.certifications || []).map((c) => (
              <li key={c} className="cert"><AppIcon name="check" size={13} /> {c}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="prof-rail">
        <section className="panel">
          <BlockHead icon="video" title="Video introduction" />
          {me.hasVideo ? (
            <div className="video-slot" style={{ cursor: 'default' }}>
              <span className="video-play"><AppIcon name="check" size={18} /></span>
              <strong>Video intro live</strong>
              <span>Auto-plays on your swipe card.</span>
            </div>
          ) : (
            <button className="video-slot" onClick={onRecordVideo}>
              <span className="video-play"><AppIcon name="play" size={18} /></span>
              <strong>Record your 30-second intro</strong>
              <span>“Hi, I'm building an AI healthcare startup…”</span>
              <em>Auto-plays on your swipe card · boosts profile strength</em>
            </button>
          )}
        </section>

        <section className="panel">
          <BlockHead icon="layers" title="Skills & tech stack" />
          <div className="pc-chips">
            {(me.skills || []).map((s) => (
              <span className="chip" key={s}>{s}</span>
            ))}
          </div>
          <BlockHead icon="heart" title="Interests" />
          <div className="pc-chips">
            {(me.interests || []).map((s) => (
              <span className="chip chip-red" key={s}>{s}</span>
            ))}
          </div>
        </section>

        {me.startup && (
          <section className="panel">
            <BlockHead icon="rocket" title="Startup" />
            <div className="kv-list">
              <div><span>Company</span><strong>{me.startup.name}</strong></div>
              <div><span>Stage</span><strong>{me.startup.stage}</strong></div>
              <div><span>Looking for</span><strong>{me.startup.looking}</strong></div>
              <div><span>Open to collaborate</span><strong className="ok">{me.openToCollab ? 'Yes' : 'No'}</strong></div>
              <div><span>Open to work</span><strong>{me.openToWork ? 'Yes' : 'No'}</strong></div>
            </div>
          </section>
        )}

        <section className="panel">
          <BlockHead icon="users" title="Personality & fit" />
          <div className="pc-chips">
            {(me.personality || []).map((p) => (
              <span className="chip" key={p}>{p}</span>
            ))}
          </div>
          <div className="kv-list">
            {(me.industries || []).length > 0 && (
              <div><span>Preferred industries</span><strong>{me.industries.join(' · ')}</strong></div>
            )}
            {(me.languages || []).length > 0 && (
              <div><span>Languages</span><strong>{me.languages.join(' · ')}</strong></div>
            )}
            {(me.purposes || []).length > 0 && (
              <div><span>Here to</span><strong>{me.purposes.join(' · ')}</strong></div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Portfolio({ me, toast, onUploadResume }) {
  const resumeInput = useRef(null)
  const { data } = useApi('/projects')
  const mine = (data?.projects || []).filter((p) => p.applied || p.owner.id === me.id).slice(0, 3)
  const shown = mine.length ? mine : (data?.projects || []).slice(0, 3)

  return (
    <div className="prof-portfolio">
      <section className="panel port-share">
        <div>
          <h3><AppIcon name="link" size={15} /> Your public portfolio</h3>
          <p>A beautiful page with your projects, videos, achievements and resume — sharable anywhere.</p>
        </div>
        <div className="port-share-right">
          <code>brivia.club/@{me.handle}</code>
          <button
            className="btn btn-red btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(`https://brivia.club/@${me.handle}`)
              toast('Portfolio link copied', 'link')
            }}
          >
            Copy link
          </button>
        </div>
      </section>

      <div className="card-grid three">
        {shown.map((p) => (
          <article className="port-card" key={p.id}>
            <div className="proj-banner" style={{ backgroundImage: `url(${p.banner})` }} />
            <div className="proj-body">
              <h3>{p.name.split(' — ')[0]}</h3>
              <p>{p.blurb}</p>
              <div className="pc-chips">
                {p.stack.map((s) => (
                  <span className="chip" key={s}>{s}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="panel">
        <BlockHead icon="doc" title="Resume & links" />
        <div className="link-rows">
          <input
            ref={resumeInput}
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={(e) => onUploadResume(e.target.files?.[0])}
          />
          {me.socials?.resume ? (
            <a className="link-row" href={me.socials.resume} target="_blank" rel="noreferrer">
              <AppIcon name="doc" size={15} /> View resume <em>Replace by uploading a new one</em>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={(ev) => { ev.preventDefault(); resumeInput.current?.click() }}
              >
                Replace
              </button>
            </a>
          ) : (
            <button className="link-row" onClick={() => resumeInput.current?.click()}>
              <AppIcon name="doc" size={15} /> Upload resume <em>PDF, parsed by the engine</em>
            </button>
          )}
          {me.socials?.github && (
            <a className="link-row" href={`https://${me.socials.github}`} target="_blank" rel="noreferrer">
              <AppIcon name="git" size={15} /> {me.socials.github} <em>Proof of work</em>
            </a>
          )}
          {me.socials?.linkedin && (
            <a className="link-row" href={`https://${me.socials.linkedin}`} target="_blank" rel="noreferrer">
              <AppIcon name="link" size={15} /> {me.socials.linkedin}
            </a>
          )}
          {me.socials?.portfolio && (
            <a className="link-row" href={`https://${me.socials.portfolio}`} target="_blank" rel="noreferrer">
              <AppIcon name="compass" size={15} /> {me.socials.portfolio} <em>Personal site</em>
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

function Verification({ me, onVerify }) {
  const v = me.verified || {}
  const doneCount = VERIFY_ITEMS.filter(([k]) => v[k]).length
  return (
    <div className="prof-verify">
      <section className="panel verify-hero">
        <span className="verify-shield"><AppIcon name="shield" size={26} /></span>
        <div>
          <h3>Verified Builder</h3>
          <p>
            {doneCount} of {VERIFY_ITEMS.length} checks complete. Full verification unlocks the
            badge, boosts deck ranking and tells every match your proof-of-work is real.
          </p>
        </div>
      </section>
      <div className="verify-grid">
        {VERIFY_ITEMS.map(([key, label, hint]) => {
          const done = v[key]
          return (
            <div className={`verify-card${done ? ' done' : ''}`} key={key}>
              <span className="verify-ic">
                <AppIcon name={done ? 'check' : 'plus'} size={15} />
              </span>
              <div>
                <strong>{label}</strong>
                <span>{hint}</span>
              </div>
              {done ? (
                <em className="verify-state">Verified</em>
              ) : (
                <button className="btn btn-red btn-sm" onClick={() => onVerify(key, label)}>
                  Verify
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- edit-profile modal (writes via the existing PATCH /users/me) ---------- */
const TEXT_FIELDS = [
  ['name', 'Full name'], ['headline', 'Headline'], ['roleTitle', 'Role'], ['org', 'Company / org'],
  ['campus', 'Campus'], ['location', 'Location'], ['timezone', 'Timezone'],
  ['availability', 'Availability'], ['workStyle', 'Work style'], ['lookingFor', 'Looking for'],
]

function EditProfileModal({ me, onClose, onSaved, toast }) {
  const [form, setForm] = useState(() => {
    const f = {}
    TEXT_FIELDS.forEach(([k]) => (f[k] = me[k] || ''))
    f.bio = me.bio || ''
    f.skills = (me.skills || []).join(', ')
    f.interests = (me.interests || []).join(', ')
    return f
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const csv = (v) => v.split(',').map((x) => x.trim()).filter(Boolean)

  const save = async () => {
    setBusy(true)
    try {
      const body = { bio: form.bio, skills: csv(form.skills), interests: csv(form.interests) }
      TEXT_FIELDS.forEach(([k]) => (body[k] = form[k]))
      const { me: updated } = await api('/users/me', { method: 'PATCH', body })
      onSaved(updated)
      toast('Profile saved — the engine re-scored you', 'check')
      onClose()
    } catch (e) {
      toast(e.message, 'x')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Overlay onClose={onClose} label="Edit profile">
      <div className="pe-box" role="dialog" aria-modal="true" aria-label="Edit profile" onClick={(e) => e.stopPropagation()}>
        <div className="pe-head">
          <h3>Edit profile</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><AppIcon name="x" size={15} /></button>
        </div>
        <div className="pe-grid">
          {TEXT_FIELDS.map(([k, label]) => (
            <div className="pe-field" key={k}>
              <label htmlFor={`pe-${k}`}>{label}</label>
              <input id={`pe-${k}`} value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div className="pe-field full">
            <label htmlFor="pe-bio">Bio</label>
            <textarea id="pe-bio" value={form.bio} onChange={set('bio')} placeholder="One line on what you're building" />
          </div>
          <div className="pe-field full">
            <label htmlFor="pe-skills">Skills (comma-separated)</label>
            <input id="pe-skills" value={form.skills} onChange={set('skills')} placeholder="React, Node, LLMs" />
          </div>
          <div className="pe-field full">
            <label htmlFor="pe-interests">Interests (comma-separated)</label>
            <input id="pe-interests" value={form.interests} onChange={set('interests')} placeholder="AI, Music, Climate" />
          </div>
        </div>
        <div className="pe-actions">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="btn btn-red" loading={busy} onClick={save}>Save changes</Button>
        </div>
      </div>
    </Overlay>
  )
}

export default function Profile() {
  const { me, setMe, toast } = useOutletContext()
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const avatarInput = useRef(null)
  const coverInput = useRef(null)

  if (!me) return <Loading label="Loading your profile…" />

  const recordVideo = async () => {
    const { me: updated } = await api('/users/me', { method: 'PATCH', body: { hasVideo: true } })
    setMe(updated)
    toast('Video intro saved — profile strength updated', 'video')
  }

  // upload a file to storage, then PATCH the returned URL onto the profile
  const uploadTo = async (kind, file, patchKey) => {
    if (!file) return
    toast('Uploading…', 'clock')
    try {
      const url = await uploadFile(kind, file)
      const { me: updated } = await api('/users/me', { method: 'PATCH', body: { [patchKey]: url } })
      setMe(updated)
      toast(`${kind[0].toUpperCase()}${kind.slice(1)} updated`, 'check')
    } catch (e) {
      toast(e.message, 'x')
    }
  }

  const uploadResume = async (file) => {
    if (!file) return
    toast('Uploading resume…', 'clock')
    try {
      const url = await uploadFile('resume', file)
      const { me: updated } = await api('/users/me', { method: 'PATCH', body: { socials: { ...(me.socials || {}), resume: url } } })
      setMe(updated)
      toast('Resume uploaded', 'doc')
    } catch (e) {
      toast(e.message, 'x')
    }
  }

  const verify = async (key, label) => {
    await api(`/users/me/verify/${key}`, { method: 'POST' })
    const { me: updated } = await api('/auth/me')
    setMe(updated.me ? updated.me : updated)
    toast(`${label} verified ✓`, 'shield')
  }

  return (
    <div className="pg prof-pg">
      {/* cover + identity */}
      <section
        className="prof-cover"
        style={{ backgroundImage: me.cover ? `url(${me.cover})` : 'linear-gradient(120deg, #1a0509, #08080a)' }}
      >
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => uploadTo('cover', e.target.files?.[0], 'cover')}
        />
        <button className="btn btn-ghost btn-sm prof-cover-edit" onClick={() => coverInput.current?.click()}>
          <AppIcon name="camera" size={13} /> Change cover
        </button>
      </section>
      <section className="prof-id">
        <span className="prof-ava-wrap">
          <img className="prof-ava" src={me.avatar} alt="" />
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => uploadTo('avatar', e.target.files?.[0], 'avatar')}
          />
          <button className="prof-ava-edit" onClick={() => avatarInput.current?.click()} aria-label="Change photo" title="Change photo">
            <AppIcon name="camera" size={13} />
          </button>
        </span>
        <div className="prof-id-main">
          <h1>
            {me.name}
            {(me.verified || {}).college && (
              <span className="vtick"><AppIcon name="check" size={10} /></span>
            )}
          </h1>
          {me.headline && <p className="prof-headline">{me.headline}</p>}
          <span className="prof-role">
            {[me.roleTitle, me.campus, me.org].filter(Boolean).join(' · ')}
          </span>
          <div className="prof-badges">
            {(me.badges || []).map((b) => (
              <BadgeChip id={b} key={b} />
            ))}
          </div>
        </div>
        <div className="prof-id-actions">
          <button className="btn btn-red" onClick={() => setEditing(true)}>
            <AppIcon name="gear" size={14} /> Edit profile
          </button>
          <span className="prof-onboard-note">
            One profile powers everything — no duplicate forms anywhere.
          </span>
        </div>
      </section>

      {editing && (
        <EditProfileModal me={me} toast={toast} onClose={() => setEditing(false)} onSaved={setMe} />
      )}

      <div className="tab-row prof-tabs">
        {[
          ['overview', 'Overview'],
          ['portfolio', 'Portfolio'],
          ['verify', 'Verification'],
        ].map(([key, label]) => (
          <button key={key} className={`pill${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview me={me} onRecordVideo={recordVideo} />}
      {tab === 'portfolio' && <Portfolio me={me} toast={toast} onUploadResume={uploadResume} />}
      {tab === 'verify' && <Verification me={me} onVerify={verify} />}
    </div>
  )
}
