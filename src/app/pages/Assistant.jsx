import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { AppIcon, MatchRing, VerifiedTick } from '../ui.jsx'
import { api } from '../api.js'
import { ASSISTANT_PROMPTS } from '../appData.js'

/* 🧠 AI Assistant — POST /api/assistant answers with ranked people
   straight from the matching engine. */

export default function Assistant() {
  const { me, toast } = useOutletContext()
  const [thread, setThread] = useState([
    {
      role: 'ai',
      text: `Hey ${me?.name?.split(' ')[0] || 'builder'} — I know your profile, your matches and every open team in the club. Tell me what you need and I'll find it.`,
      people: [],
      follow: null,
    },
  ])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread, thinking])

  const ask = async (text) => {
    const q = (text ?? draft).trim()
    if (!q || thinking) return
    setThread((t) => [...t, { role: 'me', text: q }])
    setDraft('')
    setThinking(true)
    try {
      const r = await api('/assistant', { method: 'POST', body: { q } })
      setThread((t) => [...t, { role: 'ai', ...r }])
    } catch (e) {
      setThread((t) => [...t, { role: 'ai', text: e.message, people: [], follow: null }])
    } finally {
      setThinking(false)
    }
  }

  const intro = async (p) => {
    await api('/requests', { method: 'POST', body: { toId: p.id, note: 'Brivia AI suggested we build together.' } })
    toast(`Intro drafted and sent to ${p.name}`, 'send')
  }

  return (
    <div className="pg ai-pg">
      <div className="ai-shell panel">
        <header className="ai-head">
          <span className="ai-orb"><AppIcon name="bot" size={18} /></span>
          <div>
            <strong>Brivia AI</strong>
            <span>Powered by the matching engine · knows your graph</span>
          </div>
          <span className="ai-live"><span className="pulse-dot" /> Online</span>
        </header>

        <div className="ai-scroll">
          {thread.map((m, i) =>
            m.role === 'me' ? (
              <div className="bubble-row me" key={i}>
                <div className="bubble"><p>{m.text}</p></div>
              </div>
            ) : (
              <div className="bubble-row them ai" key={i}>
                <span className="ai-mini"><AppIcon name="bot" size={13} /></span>
                <div className="ai-answer">
                  <p>{m.text}</p>
                  {m.people?.length > 0 && (
                    <div className="ai-recs">
                      {m.people.map((p) => (
                        <div className="ai-rec" key={p.id}>
                          <img src={p.img} alt="" />
                          <div className="ai-rec-body">
                            <strong>
                              {p.name} {p.badges?.includes('verified') && <VerifiedTick small />}
                            </strong>
                            <span>{p.role} · {p.org}</span>
                          </div>
                          <MatchRing value={p.match} size={38} />
                          <button className="btn btn-red btn-sm" onClick={() => intro(p)}>
                            Intro me
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.follow && <p className="ai-follow">{m.follow}</p>}
                </div>
              </div>
            )
          )}
          {thinking && (
            <div className="bubble-row them ai">
              <span className="ai-mini"><AppIcon name="bot" size={13} /></span>
              <div className="ai-answer ai-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="ice-row">
          <span className="ice-label"><AppIcon name="sparkle" size={12} /> Quick asks</span>
          <div className="ice-chips">
            {ASSISTANT_PROMPTS.map((p) => (
              <button key={p} className="chip chip-btn" onClick={() => ask(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <form
          className="msg-compose"
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder='"I need a designer who gets healthcare"…'
            aria-label="Ask the AI assistant"
          />
          <button type="submit" className="btn btn-red btn-sm msg-send">
            <AppIcon name="send" size={15} /> Ask
          </button>
        </form>
      </div>

      <p className="ai-foot-note">
        Recommendations come from the same engine behind your deck — <Link to="/app/discover">see today's cards</Link>.
      </p>
    </div>
  )
}
