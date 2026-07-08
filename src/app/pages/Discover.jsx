import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { AppIcon, Loading, MatchRing, PageHead, VerifiedTick } from '../ui.jsx'
import { api } from '../api.js'

/* ❤ Swipe Discovery — deck served by the matching engine;
   swipes persist and mutual interest opens a real match + chat. */

function DeckCard({ p, children, style, ...handlers }) {
  return (
    <div className="disc-card" style={style} {...handlers}>
      {children}
      <div className="disc-photo" style={{ backgroundImage: `url(${p.img})` }}>
        <span className="tag">{p.tag}</span>
        {p.video && (
          <span className="disc-video" title="Has a 30-second video intro">
            <AppIcon name="play" size={11} /> Video intro
          </span>
        )}
        <div className="disc-photo-foot">
          <div>
            <h3>
              {p.name} {p.badges?.includes('verified') && <VerifiedTick small />}
            </h3>
            <span>{p.role} · {p.org}</span>
          </div>
          <MatchRing value={p.match} size={52} />
        </div>
      </div>
      <div className="disc-body">
        <p className="disc-bio">{p.bio}</p>
        <div className="disc-meta">
          {p.lookingFor && <span><AppIcon name="search" size={11} /> {p.lookingFor}</span>}
          {p.availability && <span><AppIcon name="clock" size={11} /> {p.availability}</span>}
        </div>
        <div className="pc-chips">
          {p.skills.slice(0, 6).map((s) => (
            <span className="chip" key={s}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MatchModal({ result, meAvatar, onClose }) {
  if (!result) return null
  const { person, id } = result
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pg-kicker" style={{ justifyContent: 'center' }}>
          <span className="pg-kicker-line" />
          It's a match
          <span className="pg-kicker-line flip" />
        </div>
        <h2>
          You &amp; <span className="red">{person.name.split(' ')[0]}</span>
        </h2>
        <div className="mm-avas">
          <img src={meAvatar} alt="" />
          <span className="mm-heart"><AppIcon name="heart" size={18} /></span>
          <img src={person.img} alt="" />
        </div>
        <p>
          {result.score}% compatibility. Chat is unlocked — the AI has icebreakers ready so
          you can skip the small talk.
        </p>
        <div className="mm-actions">
          <Link to={`/app/messages/${id}`} className="btn btn-red">
            <AppIcon name="chat" size={15} /> Say hello
          </Link>
          <button className="btn btn-ghost" onClick={onClose}>
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Discover() {
  const { me, save, isSaved, toast } = useOutletContext()
  const [deck, setDeck] = useState(null)
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const [matched, setMatched] = useState(null)
  const start = useRef({ x: 0, y: 0 })

  const loadDeck = () =>
    api('/deck').then((d) => {
      setDeck(d.deck)
      setIndex(0)
    })
  useEffect(() => {
    loadDeck()
  }, [])

  if (!deck) return <Loading label="The engine is dealing your deck…" />

  const current = deck[index]
  const next = deck[index + 1]

  const commit = (dir) => {
    if (!current) return
    const action = { like: 'LIKE', nope: 'PASS', super: 'SUPER' }[dir]
    const fly = dir === 'nope' ? -620 : 620
    setDrag({ x: fly, y: dir === 'super' ? -160 : 0, active: false })

    const target = current
    api('/swipes', { method: 'POST', body: { targetId: target.id, action } })
      .then((res) => {
        if (res.matched) setMatched(res.match)
        else if (action !== 'PASS') toast(`Interest sent to ${target.name}`, 'heart')
      })
      .catch((e) => toast(e.message, 'x'))

    setTimeout(() => {
      setIndex((i) => i + 1)
      setDrag({ x: 0, y: 0, active: false })
    }, 330)
  }

  const onDown = (e) => {
    const p = 'touches' in e ? e.touches[0] : e
    start.current = { x: p.clientX, y: p.clientY }
    setDrag((d) => ({ ...d, active: true }))
  }
  const onMove = (e) => {
    if (!drag.active) return
    const p = 'touches' in e ? e.touches[0] : e
    setDrag({ x: p.clientX - start.current.x, y: p.clientY - start.current.y, active: true })
  }
  const onUp = () => {
    if (!drag.active) return
    if (drag.x > 120) return commit('like')
    if (drag.x < -120) return commit('nope')
    setDrag({ x: 0, y: 0, active: false })
  }

  const rot = drag.x / 18
  const likeOp = Math.max(0, Math.min(1, drag.x / 120))
  const nopeOp = Math.max(0, Math.min(1, -drag.x / 120))

  return (
    <div className="pg">
      <PageHead
        kicker="Discover"
        title={<>Today's <span className="red">deck.</span></>}
        sub="Highest-compatibility builders first, scored by the AI Matching Engine on skills, goals, availability and timezone."
      />

      <div className="disc-layout">
        <div>
          <div
            className="disc-stage"
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          >
            {!current && (
              <div className="deck-empty disc-done">
                <div>
                  <div className="disc-done-spark">✦</div>
                  <h3>You're all caught up</h3>
                  <p>Fresh cards land as new builders join. Premium members get unlimited decks.</p>
                  <button className="btn btn-ghost" onClick={loadDeck}>
                    Check for new cards
                  </button>
                </div>
              </div>
            )}
            {next && (
              <DeckCard p={next} style={{ transform: 'scale(0.95) translateY(16px)', opacity: 0.7 }} />
            )}
            {current && (
              <DeckCard
                p={current}
                onMouseDown={onDown}
                onTouchStart={onDown}
                style={{
                  transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`,
                  transition: drag.active ? 'none' : undefined,
                  cursor: drag.active ? 'grabbing' : 'grab',
                }}
              >
                <span className="stamp like" style={{ opacity: likeOp }}>CONNECT</span>
                <span className="stamp nope" style={{ opacity: nopeOp }}>PASS</span>
              </DeckCard>
            )}
          </div>

          <div className="disc-actions">
            <button className="round-btn nope" onClick={() => commit('nope')} aria-label="Pass" title="Pass">
              <AppIcon name="x" size={22} />
            </button>
            <button
              className={`round-btn savebtn${current && isSaved('person', current.id) ? ' active' : ''}`}
              onClick={() => current && save('person', current.id)}
              aria-label="Save for later"
              title="Save for later"
            >
              <AppIcon name="save" size={19} />
            </button>
            <button className="round-btn like" onClick={() => commit('like')} aria-label="Connect" title="Connect">
              <AppIcon name="heart" size={22} />
            </button>
            <button
              className="round-btn super"
              onClick={() => commit('super')}
              aria-label="Super connect"
              title="Super Connect — connects instantly"
            >
              <AppIcon name="flame" size={20} />
            </button>
          </div>
        </div>

        {/* why-this-match rail */}
        <aside className="disc-why panel">
          <div className="block-head">
            <h2><AppIcon name="sparkle" size={15} /> Why this match</h2>
            {current && <MatchRing value={current.match} size={44} />}
          </div>
          {current ? (
            <>
              <ul className="why-list">
                {current.why.map((w) => (
                  <li key={w}>
                    <AppIcon name="check" size={13} /> {w}
                  </li>
                ))}
              </ul>
              {current.communities.length > 0 && (
                <div className="why-foot">
                  <span>Their communities</span>
                  <div className="pc-chips">
                    {current.communities.map((c) => (
                      <span className="chip chip-red" key={c}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="empty-note">Deal a card to see the engine's reasoning.</p>
          )}
          <div className="why-legend">
            <span><AppIcon name="x" size={12} /> Pass</span>
            <span><AppIcon name="save" size={12} /> Save</span>
            <span><AppIcon name="heart" size={12} /> Connect</span>
            <span><AppIcon name="flame" size={12} /> Super</span>
          </div>
        </aside>
      </div>

      <MatchModal result={matched} meAvatar={me?.avatar} onClose={() => setMatched(null)} />
    </div>
  )
}
