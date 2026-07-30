import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SwipeDeck from './SwipeDeck.jsx'
import Reveal from './components/Reveal.jsx'
import Counter from './components/Counter.jsx'
import Icon from './components/Icons.jsx'
import SectionHead from './components/SectionHead.jsx'
import {
  TICKER,
  CAMPUSES,
  STATS,
  STEPS,
  FEATURES,
  TIMELINE,
  FEATURED_STORY,
  TESTIMONIALS,
  FAQS,
} from './data.js'
import HERO_IMG from './assets/hero.png'

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

function SwipeButton() {
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
        Swipe to <span className="m">Match</span>
        <span className="spark">✦</span>
      </span>
    </button>
  )
}

/* ---------- header ---------- */
const NAV_LINKS = [
  ['#how', 'How it works'],
  ['#deck', 'Discover'],
  ['#stories', 'Stories'],
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

  // lock page scroll + close on Escape while the menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // close first, then scroll — the body scroll-lock would swallow the jump
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
            <a key={href} href={href}>
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

/* ---------- hero ---------- */
function Hero() {
  return (
    <section className="hero" id="top">
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <div className="hero-copy">
        <div className="eyebrow">
          Find Your People,
          <br />
          Build Your Future
        </div>
        <div className="est">EST. 2026</div>
        <h1 className="headline">
          Swipe. <span className="red">Match.</span> Build
        </h1>
        <p className="subtitle">
          AI-powered matchmaking for startups, hackathons, projects, and opportunities.
        </p>
        <SwipeButton />
        <div className="trust">
          <span>Builders from</span>
          <div className="trust-row">
            {CAMPUSES.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-media">
        <img src={HERO_IMG} alt="Founders working together at dusk, city skyline behind" />
        <div className="hero-badge">
          <span className="pulse-dot" aria-hidden="true" />
          214 builders matched this week
        </div>
      </div>

      <a className="scroll-cue" href="#stats" aria-label="Scroll to explore">
        <span aria-hidden="true" />
        Scroll
      </a>
    </section>
  )
}

/* ---------- marquee ribbon ---------- */
function Marquee() {
  const seg = (
    <>
      {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
        <span className="marquee-item" key={i}>
          {item} <span className="marquee-sep">✦</span>
        </span>
      ))}
    </>
  )
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <div className="marquee-seg">{seg}</div>
        <div className="marquee-seg">{seg}</div>
      </div>
    </div>
  )
}

/* ---------- stats ---------- */
function Stats() {
  return (
    <section className="section stats" id="stats">
      <div className="container">
        <SectionHead
          kicker="The club, in numbers"
          title={
            <>
              Proof, not <span className="red">promises.</span>
            </>
          }
          sub="Every number below is a team that met as strangers and shipped as partners."
        />
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <Reveal className="stat" key={s.label} delay={i * 90}>
              <div className="stat-value">
                <Counter to={s.value} />
                <span className="suffix">{s.suffix}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="watermark" aria-hidden="true">
        BRIVIA
      </div>
    </section>
  )
}

/* ---------- how it works ---------- */
function HowItWorks() {
  return (
    <section className="section how" id="how">
      <div className="container">
        <SectionHead
          kicker="How it works"
          title={
            <>
              Four moves. <span className="red">One team.</span>
            </>
          }
          sub="No cold DMs, no LinkedIn safaris, no group-chat ghost towns. Just a deck of people who actually fit."
        />
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal className="step" key={s.num} delay={i * 90}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- swipe deck ---------- */
function DeckSection() {
  const [deckKey, setDeckKey] = useState(0)
  return (
    <section className="section tint deck-section" id="deck">
      <div className="container">
        <SectionHead
          kicker="Discover"
          title={
            <>
              Your next <span className="red">co-founder</span> awaits
            </>
          }
          sub="Swipe right to connect. Swipe left to pass. This is a live taste of the deck — the real one learns you."
        />
        <Reveal delay={120}>
          <SwipeDeck key={deckKey} onReset={() => setDeckKey((k) => k + 1)} />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- features ---------- */
function Features() {
  return (
    <section className="section why" id="why">
      <div className="container">
        <SectionHead
          kicker="Why Brivia"
          title={
            <>
              Engineered for <span className="red">serious</span> builders
            </>
          }
          sub="Everything in the club exists to compress the distance between “nice to meet you” and “we shipped it.”"
        />
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <Reveal className="feature" key={f.title} delay={(i % 3) * 90}>
              <div className="feature-ic">
                <Icon name={f.icon} />
              </div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- success stories ---------- */
function Stories() {
  return (
    <section className="section tint stories" id="stories">
      <div className="container">
        <SectionHead
          kicker="Success stories"
          title={
            <>
              Matched here. <span className="red">Shipped everywhere.</span>
            </>
          }
          sub="The club keeps score in demo days, launches and funded rounds — here are a few of ours."
        />

        <div className="story-featured">
          <Reveal className="story-quote">
            <div className="qmark" aria-hidden="true">
              “
            </div>
            <blockquote>{FEATURED_STORY.quote}</blockquote>
            <div className="story-authors">
              <div className="avatars">
                {FEATURED_STORY.avatars.map((a) => (
                  <img key={a} src={a} alt="" />
                ))}
              </div>
              <div>
                <strong>{FEATURED_STORY.names}</strong>
                <span>{FEATURED_STORY.role}</span>
              </div>
            </div>
            <div className="story-tags">
              {FEATURED_STORY.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </Reveal>

          <Reveal className="story-timeline" delay={140}>
            {TIMELINE.map((t) => (
              <div className="tl-item" key={t.week}>
                <span className="tl-dot" aria-hidden="true" />
                <div>
                  <strong>{t.week}</strong>
                  <p>{t.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="story-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal className="story-card" key={t.name} delay={i * 90}>
              <div className="stars" aria-hidden="true">
                ✦✦✦✦✦
              </div>
              <blockquote>“{t.quote}”</blockquote>
              <div className="who">
                <img src={t.img} alt="" />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
              <div className="result">{t.result}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */
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
          <SectionHead
            align="left"
            kicker="FAQ"
            title={
              <>
                Everything you're <span className="red">wondering.</span>
              </>
            }
            sub="Can't find your answer? Write to hello@briviaclub.com — a human replies within a day."
          />
        </div>
        <Reveal className="faq-list" delay={120}>
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              {...f}
              open={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- final CTA ---------- */
function FinalCta() {
  return (
    <section className="section final-cta">
      <div className="orb orb-1" aria-hidden="true" />
      <Reveal className="cta-inner">
        <div className="kicker">
          <span className="kicker-line" />
          Membership is open
          <span className="kicker-line" />
        </div>
        <h2 className="cta-title">
          Your next team is <span className="red">one swipe</span> away.
        </h2>
        <p className="cta-sub">
          Join 12,000+ students and professionals already building together. It takes two minutes
          to craft your card.
        </p>
        <SwipeButton />
      </Reveal>
    </section>
  )
}

/* ---------- footer ---------- */
const FOOTER_GROUPS = [
  {
    id: 'footer-acc-product',
    title: 'Product',
    links: [
      ['#deck', 'Discover'],
      ['#how', 'How it works'],
      ['#stories', 'Success stories'],
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

/**
 * Link group — a tap-to-expand accordion on phones, a plain open column from
 * tablet up. Uses a hidden checkbox + label (not <details>) so the "always
 * open on desktop" override is a plain CSS rule instead of fighting each
 * browser's native details-hiding implementation.
 */
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
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <HowItWorks />
        <DeckSection />
        <Features />
        <Stories />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
