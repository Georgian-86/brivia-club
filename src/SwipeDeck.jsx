import { useRef, useState } from 'react'

const PROFILES = [
  {
    id: 1,
    name: 'Aarav Mehta',
    role: 'Full-Stack Engineer · IIT Bombay',
    tag: 'Hackathon',
    bio: 'Shipped 3 hackathon wins. Looking for a designer + PM to build an AI note-taker this weekend.',
    skills: ['React', 'Node', 'LLMs', 'Postgres'],
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Sara Khan',
    role: 'Product Designer · NID',
    tag: 'Startup',
    bio: 'UX-obsessed designer who loves 0-to-1 products. Seeking a technical co-founder for a fintech idea.',
    skills: ['Figma', 'UX Research', 'Branding', 'Webflow'],
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Rohan Verma',
    role: 'ML Engineer · Google',
    tag: 'Side Project',
    bio: 'Deep learning by day. Want to build an open-source RAG tool with a couple of driven builders.',
    skills: ['PyTorch', 'RAG', 'Python', 'MLOps'],
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Ananya Rao',
    role: 'Growth & Marketing · IIM-A',
    tag: 'Startup',
    bio: 'Took a D2C brand to 6-figures. Looking to partner with makers who need go-to-market firepower.',
    skills: ['Growth', 'SEO', 'Content', 'Analytics'],
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Dev Patel',
    role: 'CS Undergrad · BITS Pilani',
    tag: 'Hackathon',
    bio: 'Backend nerd who lives on coffee and Docker. Free every weekend for a serious hackathon squad.',
    skills: ['Go', 'Docker', 'AWS', 'GraphQL'],
    img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80',
  },
]

export default function SwipeDeck({ onReset }) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const start = useRef({ x: 0, y: 0 })

  const current = PROFILES[index]

  const commit = (dir) => {
    const fly = dir === 'like' ? 600 : -600
    setDrag({ x: fly, y: 0, active: false })
    setTimeout(() => {
      setIndex((i) => i + 1)
      setDrag({ x: 0, y: 0, active: false })
    }, 320)
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

  if (!current) {
    return (
      <div className="deck-stage">
        <div className="deck-empty">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✦</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>
              You&apos;re all caught up
            </div>
            <p style={{ marginTop: 8 }}>Great taste. Check back for fresh builders soon.</p>
            <button onClick={onReset}>Start over</button>
          </div>
        </div>
      </div>
    )
  }

  const rot = drag.x / 18
  const likeOp = Math.max(0, Math.min(1, drag.x / 120))
  const nopeOp = Math.max(0, Math.min(1, -drag.x / 120))

  return (
    <>
      <div
        className="deck-stage"
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      >
        {/* next card peeking behind */}
        {PROFILES[index + 1] && (
          <Card profile={PROFILES[index + 1]} style={{ transform: 'scale(0.95) translateY(14px)' }} />
        )}

        <Card
          profile={current}
          onMouseDown={onDown}
          onTouchStart={onDown}
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`,
            transition: drag.active ? 'none' : undefined,
            cursor: drag.active ? 'grabbing' : 'grab',
          }}
        >
          <span className="stamp like" style={{ opacity: likeOp }}>
            CONNECT
          </span>
          <span className="stamp nope" style={{ opacity: nopeOp }}>
            PASS
          </span>
        </Card>
      </div>

      <div className="deck-actions">
        <button className="round-btn nope" onClick={() => commit('nope')} aria-label="Pass">
          ✕
        </button>
        <button className="round-btn like" onClick={() => commit('like')} aria-label="Connect">
          ♥
        </button>
      </div>
    </>
  )
}

function Card({ profile, children, style, ...handlers }) {
  return (
    <div className="match-card" style={style} {...handlers}>
      {children}
      <span className="tag">{profile.tag}</span>
      <div className="photo" style={{ backgroundImage: `url(${profile.img})` }} />
      <div className="body">
        <h3>{profile.name}</h3>
        <div className="role">{profile.role}</div>
        <p className="bio">{profile.bio}</p>
        <div className="chips">
          {profile.skills.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
