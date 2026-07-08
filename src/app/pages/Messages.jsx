import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useParams, useNavigate } from 'react-router-dom'
import { AppIcon, Loading, VerifiedTick } from '../ui.jsx'
import { api, getSocket } from '../api.js'

/* 💬 Messaging — unlocked only after a match. Real persistence,
   realtime delivery over Socket.IO, AI icebreakers per match. */

const fmtAt = (at) => {
  const d = new Date(at)
  const days = (Date.now() - d) / 86400e3
  if (days < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useOutletContext()
  const [convos, setConvos] = useState(null)
  const [thread, setThread] = useState(null)
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  const activeId = id && convos?.some((c) => c.id === id) ? id : convos?.[0]?.id
  const convo = convos?.find((c) => c.id === activeId)

  useEffect(() => {
    api('/matches').then((d) => setConvos(d.matches))
  }, [])

  useEffect(() => {
    if (!activeId) return
    setThread(null)
    api(`/matches/${activeId}/messages`).then((d) => setThread(d.messages))
    setConvos((cs) => cs?.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)))
  }, [activeId])

  // realtime delivery
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onMsg = ({ matchId, message }) => {
      if (matchId === activeId) {
        setThread((t) => (t ? [...t, message] : t))
        api(`/matches/${matchId}/messages`).catch(() => {}) // marks read
      }
      setConvos((cs) =>
        cs?.map((c) =>
          c.id === matchId
            ? {
                ...c,
                lastMessage: { body: message.body, at: message.at, mine: false },
                unread: matchId === activeId ? 0 : c.unread + 1,
              }
            : c
        )
      )
    }
    socket.on('message:new', onMsg)
    return () => socket.off('message:new', onMsg)
  }, [activeId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [activeId, thread?.length])

  if (!convos) return <Loading label="Opening your team rooms…" />

  if (convos.length === 0) {
    return (
      <div className="pg">
        <div className="panel empty-panel">
          <AppIcon name="chat" size={26} />
          <h3>No matches yet</h3>
          <p>Chat unlocks after a mutual match — head to Discover and start swiping.</p>
        </div>
      </div>
    )
  }

  const person = convo.person

  const send = async (text) => {
    const body = (text ?? draft).trim()
    if (!body) return
    setDraft('')
    const { message } = await api(`/matches/${activeId}/messages`, {
      method: 'POST',
      body: { body },
    })
    setThread((t) => [...(t || []), message])
    setConvos((cs) =>
      cs.map((c) =>
        c.id === activeId ? { ...c, lastMessage: { body, at: message.at, mine: true } } : c
      )
    )
  }

  return (
    <div className="pg msg-pg">
      <div className="msg-layout panel">
        {/* conversation list */}
        <aside className="msg-list">
          <div className="msg-list-head">
            <h2><AppIcon name="chat" size={15} /> Messages</h2>
            <span className="msg-hint">Matches only</span>
          </div>
          {convos.map((c) => (
            <button
              key={c.id}
              className={`msg-row${c.id === activeId ? ' active' : ''}`}
              onClick={() => navigate(`/app/messages/${c.id}`)}
            >
              <div className="pc-ava-wrap">
                <img src={c.person.img} alt="" />
                {c.person.online && <span className="pc-online" />}
              </div>
              <div className="msg-row-body">
                <strong>{c.person.name}</strong>
                <span>{c.lastMessage ? c.lastMessage.body : 'Say hello — the ice breakers are ready'}</span>
              </div>
              <div className="msg-row-meta">
                {c.lastMessage && <span>{fmtAt(c.lastMessage.at)}</span>}
                {c.unread > 0 && <em>{c.unread}</em>}
              </div>
            </button>
          ))}
          <div className="msg-lock">
            <AppIcon name="shield" size={13} />
            Chat unlocks only after a mutual match — no cold DMs, ever.
          </div>
        </aside>

        {/* thread */}
        <section className="msg-thread">
          <header className="msg-thread-head">
            <div className="pc-ava-wrap">
              <img src={person.img} alt="" />
              {person.online && <span className="pc-online" />}
            </div>
            <div>
              <strong>
                {person.name} {person.badges?.includes('verified') && <VerifiedTick small />}
              </strong>
              <span>{person.online ? 'Online now' : 'Away'} · {convo.score}% match</span>
            </div>
            <div className="msg-tools">
              <button className="icon-btn" title="Voice call" onClick={() => toast('Calling ' + person.name + '…', 'mic')}>
                <AppIcon name="mic" size={16} />
              </button>
              <button className="icon-btn" title="Video call" onClick={() => toast('Starting video call…', 'video')}>
                <AppIcon name="video" size={16} />
              </button>
              <button
                className="icon-btn"
                title="Schedule a meeting"
                onClick={() => toast('Meeting scheduled — tomorrow 6:30 PM IST', 'calendar')}
              >
                <AppIcon name="calendar" size={16} />
              </button>
            </div>
          </header>

          <div className="msg-scroll">
            <div className="msg-matchnote">
              <AppIcon name="heart" size={12} />
              You matched with {person.name.split(' ')[0]} — {convo.score}% compatibility
            </div>
            {!thread && <Loading label="Loading messages…" />}
            {thread?.map((m) => (
              <div className={`bubble-row ${m.from}`} key={m.id}>
                {m.from === 'them' && <img className="bubble-ava" src={person.img} alt="" />}
                <div className={`bubble${m.kind === 'CODE' ? ' code' : ''}`}>
                  {m.kind === 'CODE' ? <pre>{m.body}</pre> : <p>{m.body}</p>}
                  <span className="bubble-at">{fmtAt(m.at)}</span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* AI icebreakers */}
          <div className="ice-row">
            <span className="ice-label">
              <AppIcon name="sparkle" size={12} /> AI icebreakers
            </span>
            <div className="ice-chips">
              {convo.icebreakers.map((b) => (
                <button key={b} className="chip chip-btn" onClick={() => send(b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <form
            className="msg-compose"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <button type="button" className="icon-btn" title="Attach a file" onClick={() => toast('File attach lands with the storage service', 'doc')}>
              <AppIcon name="plus" size={16} />
            </button>
            <button type="button" className="icon-btn" title="Voice note" onClick={() => toast('Voice notes land with the storage service', 'mic')}>
              <AppIcon name="mic" size={16} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${person.name.split(' ')[0]}…`}
              aria-label="Message"
            />
            <button type="submit" className="btn btn-red btn-sm msg-send" aria-label="Send">
              <AppIcon name="send" size={15} /> Send
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
