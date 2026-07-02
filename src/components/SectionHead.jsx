import Reveal from './Reveal.jsx'

/** Editorial section header — kicker line, serif title, optional sub. */
export default function SectionHead({ kicker, title, sub, align = 'center' }) {
  return (
    <Reveal className={`section-head${align === 'left' ? ' left' : ''}`}>
      <div className="kicker">
        <span className="kicker-line" />
        {kicker}
        {align !== 'left' && <span className="kicker-line" />}
      </div>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </Reveal>
  )
}
