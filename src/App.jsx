import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SwipeDeck from './SwipeDeck.jsx'
import Counter from './components/Counter.jsx'
import Icon from './components/Icons.jsx'
import WorldCanvas from './world/WorldCanvas.jsx'
import { ZONES } from './world/palette.js'
import { world, useWorldInput } from './world/worldState.js'
import { CAMPUSES, STATS, STEPS, FEATURED_STORY, TESTIMONIALS, FAQS } from './data.js'

/* ============================================================
   THE BRIVIA CLUB — a journey through a living universe
   One fixed WebGL world behind the page; each chapter of copy
   pins to the viewport while the camera flies to its scene.
   ============================================================ */

/* ---------- shared: swipe-to-login CTA ---------- */
function useSwipeToLogin() {
  const navigate = useNavigate()
  const [swiping, setSwiping] = useState(false)
  const go = () => {
    if (swiping) return
    setSwiping(true)
    setTimeout(() => navigate('/login'), 650) // let the card-fly animation play
  }
  return [swiping, go]
}

function SwipeButton({ label = 'Start Matching' }) {
  const [swiping, go] = useSwipeToLogin()
  return (
    <button className={`swipe-btn${swiping ? ' is-swiping' : ''}`} onClick={go}>
      <span className="cards">
        <span className="card-shape" />
        <span className="card-shape" />
        <span className="card-shape" />
      </span>
      <span className="btn-text">
        <span className="arrows">&gt;&gt;&gt;</span>
        {label}
        <span className="spark">✦</span>
      </span>
    </button>
  )
}

/* ---------- header ---------- */
const NAV_LINKS = [
  ['#engine', 'The Engine'],
  ['#zones', 'The World'],
  ['#match', 'Discover'],
  ['#faq', 'FAQ'],
]

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const goTo = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  return (
    <>
      <header
        className={`site-header${scrolled ? ' scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}
      >
        <a className="brand" href="#top" onClick={(e) => goTo(e, '#top')}>
          The <span className="accent">B</span>rivia <span className="accent">C</span>lub
        </a>
        <nav className="nav">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => goTo(e, href)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <Link to="/login" className="nav-cta">
            Join the Club
          </Link>
          <button
            className={`menu-btn${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <nav>
          {NAV_LINKS.map(([href, label], i) => (
            <a
              key={href}
              href={href}
              style={{ transitionDelay: menuOpen ? `${90 + i * 60}ms` : '0ms' }}
              onClick={(e) => goTo(e, href)}
            >
              {label}
            </a>
          ))}
          <Link
            to="/login"
            className="nav-cta menu-join"
            style={{ transitionDelay: menuOpen ? `${90 + NAV_LINKS.length * 60}ms` : '0ms' }}
            onClick={() => setMenuOpen(false)}
          >
            Join the Club
          </Link>
        </nav>
      </div>
    </>
  )
}

/* ---------- intro veil ---------- */
function IntroVeil({ gone }) {
  return (
    <div className={`world-intro${gone ? ' gone' : ''}`} aria-hidden="true">
      <div className="wi-brand">
        The <span>B</span>rivia <span>C</span>lub
      </div>
      <div className="wi-line" />
      <div className="wi-label">Entering the universe</div>
    </div>
  )
}

/* ---------- journey tracker (fixed HUD) ---------- */
const PHASES = [
  { label: 'Discover', from: ['hero', 'start'], to: ['zone-community', 'end'] },
  { label: 'Match', from: ['match', 'start'], to: ['match', 'end'] },
  { label: 'Connect', from: ['connect', 'start'], to: ['connect', 'end'] },
  { label: 'Build', from: ['build', 'start'], to: ['cta', 'end'] },
]

function JourneyTracker() {
  const refs = useRef([])
  const root = useRef(null)
  useEffect(() => {
    let raf
    const tick = () => {
      const p = world.scroll
      if (root.current) {
        // retire the HUD once the visitor lands on the FAQ/footer ground
        const ground = document.querySelector('.journey-ground')
        const gone = ground && ground.getBoundingClientRect().top < innerHeight * 0.72
        root.current.classList.toggle('jt-gone', !!gone)
      }
      PHASES.forEach((ph, i) => {
        const el = refs.current[i]
        const a = world.stamps[ph.from[0]]?.[ph.from[1]]
        const b = world.stamps[ph.to[0]]?.[ph.to[1]]
        if (!el || a === undefined || b === undefined) return
        const fill = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)))
        el.style.setProperty('--fill', fill)
        el.classList.toggle('active', fill > 0 && fill < 1)
        el.classList.toggle('done', fill >= 1)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="journey-tracker" ref={root} aria-hidden="true">
      {PHASES.map((ph, i) => (
        <div className="jt-phase" key={ph.label} ref={(el) => (refs.current[i] = el)}>
          <span className="jt-label">{ph.label}</span>
          <span className="jt-bar">
            <span className="jt-fill" />
          </span>
        </div>
      ))}
    </div>
  )
}

/* ---------- chapter shell ---------- */
function Chapter({ id, h = 140, className = '', children }) {
  const ref = useRef(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), {
      rootMargin: '-32% 0px -32% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section
      id={id}
      data-chapter={id}
      ref={ref}
      className={`chapter${live ? ' live' : ''}${className ? ` ${className}` : ''}`}
      style={{ minHeight: `${h}vh` }}
    >
      <div className="ch-pin">
        <div className="ch-inner">{children}</div>
      </div>
    </section>
  )
}

/* ---------- chapter 0 · hero ---------- */
function HeroChapter() {
  return (
    <Chapter id="hero" h={165} className="ch-hero">
      <div className="w-hero">
        <div className="w-eyebrow">
          <span className="w-eyebrow-line" />
          The Brivia Club · A living universe of builders
          <span className="w-eyebrow-line" />
        </div>
        <h1 className="w-headline">
          Meet the people you're
          <br />
          <em>
            meant to <span className="red">build</span> with.
          </em>
        </h1>
        <p className="w-sub">
          AI-powered matchmaking for founders, creators, professionals, students, musicians and
          builders — one swipe away from your next team.
        </p>
        <div className="w-cta-row">
          <SwipeButton label="Start Matching" />
          <a
            className="ghost-btn"
            href="#alone"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#alone')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Explore the world <span className="ghost-arrow">↓</span>
          </a>
        </div>
        <div className="w-trust">
          <span>Builders from</span>
          <div className="w-trust-row">
            {CAMPUSES.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="scroll-cue-w" aria-hidden="true">
        <span className="cue-line" />
        Scroll to enter
      </div>
    </Chapter>
  )
}

/* ---------- chapter 1 · alone ---------- */
function AloneChapter() {
  return (
    <Chapter id="alone" h={130}>
      <div className="w-narrative">
        <div className="w-kicker">The journey begins</div>
        <h2 className="w-title">
          You arrive <em className="red">alone.</em>
        </h2>
        <p className="w-body">
          One profile drifting in a universe of twelve thousand builders. A single point of light —
          full of ideas, missing a team.
        </p>
        <p className="w-whisper">Then the Engine notices you.</p>
      </div>
    </Chapter>
  )
}

/* ---------- chapter 2 · the AI engine ---------- */
const MATCH_CHIPS = [
  { pct: 94, label: 'Design × Backend', style: { top: '4%', left: '-1%' } },
  { pct: 88, label: 'Same hackathon', style: { top: '14%', right: '-2%' } },
  { pct: 91, label: 'Co-founder intent', style: { bottom: '32%', left: '-3%' } },
  { pct: 86, label: 'Timezone aligned', style: { bottom: '20%', right: '-1%' } },
]

function EngineChapter() {
  return (
    <Chapter id="engine" h={190} className="ch-engine">
      <div className="w-narrative">
        <div className="w-kicker">The AI Matching Engine</div>
        <h2 className="w-title">
          An intelligence that <em className="red">reads intent.</em>
        </h2>
        <p className="w-body">
          The core studies what you build, what you lack and what you're reaching for — then
          weaves neural pathways to the people who complete you. Not followers. Not contacts.{' '}
          <strong>Counterparts.</strong>
        </p>
        <div className="compat-card">
          <div className="compat-heads">
            <img src={FEATURED_STORY.avatars[0]} alt="" />
            <span className="compat-spark">⚡</span>
            <img src={FEATURED_STORY.avatars[1]} alt="" />
          </div>
          <div className="compat-score">
            <Counter to={94} duration={2200} />
            <span>%</span>
          </div>
          <div className="compat-meter">
            <span className="compat-fill" />
          </div>
          <div className="compat-tags">
            <span>Growth × Product</span>
            <span>Both all-in</span>
            <span>2 mutual circles</span>
          </div>
        </div>
        <div className="engine-caps">
          <span>
            <Icon name="cards" /> AI-curated decks
          </span>
          <span>
            <Icon name="shield" /> Verified builders
          </span>
          <span>
            <Icon name="layers" /> Skill-gap matching
          </span>
        </div>
      </div>
      {MATCH_CHIPS.map((c) => (
        <div className="match-chip" key={c.label} style={c.style}>
          <strong>{c.pct}%</strong> {c.label}
        </div>
      ))}
    </Chapter>
  )
}

/* ---------- chapters 3-7 · the zones ---------- */
function ZoneChapter({ zone, index }) {
  const side = index % 2 === 0 ? 'right' : 'left'
  return (
    <Chapter
      id={`zone-${zone.id}`}
      h={115}
      className={`ch-zone ch-zone-${side}${index === 0 ? ' ch-zones-anchor' : ''}`}
    >
      {index === 0 && <span id="zones" className="zones-anchor" aria-hidden="true" />}
      <div className="zone-panel" style={{ '--zc': zone.color }}>
        <div className="zone-kicker">
          {zone.kicker} · The World of Brivia
        </div>
        <h3 className="zone-name">{zone.name}</h3>
        <p className="zone-blurb">{zone.blurb}</p>
        <div className="zone-stat">
          <span className="zone-dot" />
          {zone.stat}
        </div>
      </div>
    </Chapter>
  )
}

/* ---------- chapter 8 · match ---------- */
function MatchChapter() {
  const [deckKey, setDeckKey] = useState(0)
  return (
    <Chapter id="match" h={185} className="ch-match">
      <div className="match-grid">
        <div className="match-copy">
          <div className="w-kicker">Discover → Match</div>
          <h2 className="w-title">
            One swipe starts <em className="red">a universe.</em>
          </h2>
          <p className="w-body">
            Profiles drift through the world as holographic cards. A mutual right-swipe ignites a
            shockwave — pathways form, a team room opens, and two strangers become a squad.
          </p>
          <div className="steps-strip">
            {STEPS.map((s) => (
              <div className="step-mini" key={s.num}>
                <span className="step-mini-num">{s.num}</span>
                <span className="step-mini-title">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="holo-frame">
          <div className="holo-frame-glow" aria-hidden="true" />
          <div className="holo-tag">Live deck · try a swipe</div>
          <SwipeDeck key={deckKey} onReset={() => setDeckKey((k) => k + 1)} />
        </div>
      </div>
    </Chapter>
  )
}

/* ---------- chapter 9 · connect ---------- */
const CHAT_LOOP = [
  { who: 'them', text: 'Loved your pitch deck — what stack are you on?' },
  { who: 'me', text: 'React + FastAPI. Need design firepower 🔥' },
  { who: 'them', text: "I'm in. HackBengaluru this weekend?" },
  { who: 'me', text: 'Team room is open. Let’s build. 🚀' },
]

function ConnectChapter() {
  return (
    <Chapter id="connect" h={150} className="ch-connect">
      <div className="connect-grid">
        <div className="holo-chat" style={{ '--loop': '9s' }}>
          <div className="holo-chat-head">
            <span className="pulse-dot" />
            Team room · PayFlow
          </div>
          {CHAT_LOOP.map((m, i) => (
            <div
              className={`chat-bubble ${m.who}`}
              key={i}
              style={{ animationDelay: `${0.6 + i * 1.6}s` }}
            >
              {m.text}
            </div>
          ))}
          <div className="chat-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="connect-copy">
          <div className="w-kicker">Connect</div>
          <h2 className="w-title">
            From match to <em className="red">momentum.</em>
          </h2>
          <p className="w-body">
            Every match opens a private team room — icebreakers, role tags, a shared board.
            Messages flow between you like energy streams, and shared goals start taking shape in
            the world.
          </p>
        </div>
      </div>
    </Chapter>
  )
}

/* ---------- chapter 10 · build ---------- */
function BuildChapter() {
  return (
    <Chapter id="build" h={190} className="ch-build">
      <div className="build-wrap">
        <div className="w-kicker">Build</div>
        <h2 className="w-title">
          Ideas become <em className="red">structures</em> here.
        </h2>
        <div className="w-stats">
          {STATS.map((s) => (
            <div className="w-stat" key={s.label}>
              <div className="w-stat-value">
                <Counter to={s.value} />
                <span>{s.suffix}</span>
              </div>
              <div className="w-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <figure className="story-holo">
          <blockquote>“{FEATURED_STORY.quote}”</blockquote>
          <figcaption>
            <div className="story-holo-heads">
              {FEATURED_STORY.avatars.map((a) => (
                <img key={a} src={a} alt="" />
              ))}
            </div>
            <div>
              <strong>{FEATURED_STORY.names}</strong>
              <span>{FEATURED_STORY.role}</span>
            </div>
            <div className="story-holo-tags">
              {FEATURED_STORY.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </figcaption>
        </figure>
        <div className="mini-stories">
          {TESTIMONIALS.map((t) => (
            <div className="mini-story" key={t.name}>
              <p>“{t.quote.length > 110 ? `${t.quote.slice(0, 110).trim()}…` : t.quote}”</p>
              <div className="mini-story-who">
                <img src={t.img} alt="" />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Chapter>
  )
}

/* ---------- chapter 11 · final CTA ---------- */
function CtaChapter() {
  return (
    <Chapter id="cta" h={150} className="ch-cta">
      <div className="w-narrative">
        <div className="w-kicker">The universe is open</div>
        <h2 className="w-title w-title-xl">
          Your next team is <em className="red">one swipe</em> away.
        </h2>
        <p className="w-body">
          12,000+ founders, creators, students and builders are already inside. It takes two
          minutes to craft your card — the Engine does the rest.
        </p>
        <div className="w-cta-row">
          <SwipeButton label="Start Matching" />
        </div>
        <div className="w-motto">
          Discover · Match · Connect · <em>Build</em>
        </div>
      </div>
    </Chapter>
  )
}

/* ---------- FAQ (solid ground under the universe) ---------- */
function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-icon" aria-hidden="true">
          +
        </span>
      </button>
      <div className="faq-a">
        <div className="faq-a-inner">
          <p>{a}</p>
        </div>
      </div>
    </div>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section faq" id="faq">
      <div className="container faq-grid">
        <div className="faq-head">
          <div className="w-kicker w-kicker-left">FAQ</div>
          <h2 className="faq-title">
            Everything you're <span className="red">wondering.</span>
          </h2>
          <p className="faq-sub">
            Can't find your answer? Write to hello@briviaclub.com — a human replies within a day.
          </p>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              {...f}
              open={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */
const FOOTER_GROUPS = [
  {
    id: 'footer-acc-product',
    title: 'Product',
    links: [
      ['#match', 'Discover'],
      ['#engine', 'The Engine'],
      ['#zones', 'The World'],
      ['#faq', 'FAQ'],
    ],
  },
  {
    id: 'footer-acc-company',
    title: 'Company',
    links: [
      ['#', 'About'],
      ['#', 'Manifesto'],
      ['#', 'Careers'],
      ['#', 'Contact'],
    ],
  },
  {
    id: 'footer-acc-legal',
    title: 'Legal',
    links: [
      ['#', 'Privacy'],
      ['#', 'Terms'],
      ['#', 'Community guidelines'],
    ],
  },
]

function FooterGroup({ id, title, links }) {
  return (
    <div className="footer-col">
      <input type="checkbox" id={id} className="footer-col-toggle" />
      <label htmlFor={id} className="footer-col-summary">
        {title}
        <span className="chev" aria-hidden="true" />
      </label>
      <div className="footer-col-body">
        {links.map(([href, label]) => (
          <a key={label} href={href}>
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              The <span className="accent">B</span>rivia <span className="accent">C</span>lub
            </div>
            <p>
              AI-powered matchmaking for startups, hackathons, projects and opportunities. Find
              your people, build your future.
            </p>
            <div className="socials">
              <a href="#" aria-label="X (Twitter)">
                X
              </a>
              <a href="#" aria-label="LinkedIn">
                in
              </a>
              <a href="#" aria-label="Instagram">
                ig
              </a>
              <a href="#" aria-label="GitHub">
                gh
              </a>
            </div>
          </div>
          <div className="footer-links">
            {FOOTER_GROUPS.map((g) => (
              <FooterGroup key={g.id} {...g} />
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 The Brivia Club. All rights reserved.</span>
          <span className="footer-motto">
            Swipe. <em>Match.</em> Build.
          </span>
          <span>Made for builders, by builders.</span>
        </div>
      </div>
    </footer>
  )
}

/* ---------- page ---------- */
export default function App() {
  useWorldInput()
  const [worldReady, setWorldReady] = useState(false)

  return (
    <div id="top" className="journey-root">
      <IntroVeil gone={worldReady} />
      <WorldCanvas onReady={() => setWorldReady(true)} />
      <SiteHeader />
      <JourneyTracker />
      <main className="journey">
        <HeroChapter />
        <AloneChapter />
        <EngineChapter />
        {ZONES.map((z, i) => (
          <ZoneChapter key={z.id} zone={z} index={i} />
        ))}
        <MatchChapter />
        <ConnectChapter />
        <BuildChapter />
        <CtaChapter />
      </main>
      <div className="journey-ground">
        <Faq />
        <SiteFooter />
      </div>
    </div>
  )
}
