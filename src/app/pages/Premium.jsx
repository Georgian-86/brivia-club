import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AppIcon } from '../ui.jsx'
import { PREMIUM_PERKS } from '../appData.js'

/* 💎 Premium — the Pro tier */

export default function Premium() {
  const { toast } = useOutletContext()
  const [yearly, setYearly] = useState(true)

  return (
    <div className="pg prem-pg">
      <section className="prem-hero">
        <div className="orb orb-1" aria-hidden="true" />
        <div className="pg-kicker" style={{ justifyContent: 'center' }}>
          <span className="pg-kicker-line" />
          Brivia Premium
          <span className="pg-kicker-line flip" />
        </div>
        <h1 className="pg-title">
          Serious builders get the <span className="red">first swipe.</span>
        </h1>
        <p className="pg-sub">
          Priority placement in every compatible deck, an AI career coach that knows your graph,
          and rooms the free tier never sees.
        </p>

        <div className="prem-toggle" role="group" aria-label="Billing period">
          <button className={!yearly ? 'active' : ''} onClick={() => setYearly(false)}>Monthly</button>
          <button className={yearly ? 'active' : ''} onClick={() => setYearly(true)}>
            Yearly <em>−33%</em>
          </button>
        </div>

        <div className="prem-price">
          <span className="prem-amount">₹{yearly ? '199' : '299'}</span>
          <span className="prem-per">/month{yearly ? ' · billed yearly' : ''}</span>
        </div>

        <button
          className="btn btn-red prem-cta"
          onClick={() => toast('Redirecting to checkout — welcome to Premium ✦', 'gem')}
        >
          <AppIcon name="gem" size={16} /> Go Premium
        </button>
        <span className="prem-note">Cancel anytime · student pricing shown</span>
      </section>

      <div className="prem-grid">
        {PREMIUM_PERKS.map((p, i) => (
          <article className="prem-card" key={p.title} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="feature-ic"><AppIcon name={p.icon} size={19} /></span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </article>
        ))}
      </div>

      <section className="panel prem-compare">
        <table className="table">
          <thead>
            <tr>
              <th>What you get</th>
              <th>Free</th>
              <th className="prem-col"><AppIcon name="gem" size={12} /> Premium</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Daily deck', '10 cards', 'Unlimited'],
              ['Who viewed you', '—', 'Full list, weekly'],
              ['Search filters', 'Basic', 'Stack · campus · stage · availability'],
              ['Deck placement', 'Standard', 'Priority in compatible decks'],
              ['AI resume review', '—', 'Line-by-line, role-tuned'],
              ['AI career coach', '—', 'Private, always on'],
              ['Exclusive communities', '—', 'Founder & mentor rooms'],
            ].map(([f, free, prem]) => (
              <tr key={f}>
                <td>{f}</td>
                <td className="dim">{free}</td>
                <td className="prem-col">{prem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
