import { useOutletContext } from 'react-router-dom'
import { AppIcon, BlockHead, Loading, PageHead, StatTile } from '../ui.jsx'
import { useApi } from '../api.js'

/* 📊 Analytics — live aggregates over your swipes, matches,
   messages, applications and profile views. */

export default function Analytics() {
  const { toast } = useOutletContext()
  const { data, loading } = useApi('/analytics')

  if (loading || !data) return <Loading label="Crunching your numbers…" />

  const maxViews = Math.max(1, ...data.weekly.map((d) => d.views))
  const maxMatches = Math.max(1, ...data.weekly.map((d) => d.matches))

  return (
    <div className="pg">
      <PageHead
        kicker="Analytics"
        title={<>Your week, <span className="red">measured.</span></>}
        sub="Everything here feeds back into matching — a stronger profile earns a stronger deck."
      />

      <div className="stat-row">
        {data.stats.map((s, i) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} delay={i * 80} />
        ))}
      </div>

      <div className="ana-grid">
        <section className="panel">
          <BlockHead icon="chart" title="Weekly growth" />
          <div className="chart">
            {data.weekly.map((d) => (
              <div className="chart-col" key={d.day}>
                <div className="chart-bars">
                  <span
                    className="bar views"
                    style={{ height: `${Math.max(3, (d.views / maxViews) * 100)}%` }}
                    title={`${d.views} profile views`}
                  />
                  <span
                    className="bar matches"
                    style={{ height: `${Math.max(3, (d.matches / maxMatches) * 62)}%` }}
                    title={`${d.matches} matches`}
                  />
                </div>
                <span className="chart-day">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><em className="dot views" /> Profile views</span>
            <span><em className="dot matches" /> Matches</span>
          </div>
        </section>

        <section className="panel">
          <BlockHead icon="shield" title="Profile strength" />
          <div className="strength-hero">
            <div
              className="ring big"
              style={{ '--pct': `${data.strength.value * 3.6}deg`, width: 92, height: 92 }}
            >
              <span>{data.strength.value}%</span>
            </div>
            <p>
              Every completed item below re-scores you in the engine — quick wins first:
            </p>
          </div>
          <ul className="strength-list">
            {data.strength.items.map((s) => (
              <li key={s.item} className={s.done ? 'done' : ''}>
                <span className="strength-check">
                  <AppIcon name={s.done ? 'check' : 'plus'} size={12} />
                </span>
                {s.item}
                {!s.done && s.boost && (
                  <button
                    className="chip chip-red chip-btn"
                    onClick={() => toast('Head to your profile to complete this', 'check')}
                  >
                    {s.boost}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel funnel-panel">
        <BlockHead icon="zap" title="Your matching funnel — last 30 days" />
        <div className="funnel">
          {data.funnel.map((step, i) => (
            <div className="funnel-step" key={step.label}>
              <strong>{step.value}</strong>
              <span>{step.label}</span>
              {i < data.funnel.length - 1 && <em className="funnel-arrow" aria-hidden="true">→</em>}
            </div>
          ))}
        </div>
        <p className="panel-hint">
          These are live counts from your activity — the same funnel the club optimizes for
          (swipe → match → chat → team).
        </p>
      </section>
    </div>
  )
}
