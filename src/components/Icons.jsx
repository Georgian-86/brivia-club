/** Minimal stroke icon set — consistent 24px grid, inherits currentColor. */
const PATHS = {
  cards: (
    <>
      <rect x="7" y="3.5" width="11" height="15.5" rx="2" />
      <path d="M6.2 7.1l-2 .7a2 2 0 0 0-1.2 2.6l3.4 9.2a2 2 0 0 0 2.6 1.2l5.6-2.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.8v5.1c0 4.6-3 7.7-7 9.6-4-1.9-7-5-7-9.6V5.8z" />
      <path d="M9.3 12l2 2 3.6-4.2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.1" />
      <path d="M3.6 19.5c.6-3.1 2.8-4.9 5.4-4.9s4.8 1.8 5.4 4.9" />
      <circle cx="16.8" cy="9.6" r="2.5" />
      <path d="M16 14.7c2.3.2 4 1.7 4.5 4.2" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 12l5.4-5.4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z" />
      <path d="M3.5 12.6l8.5 4.7 8.5-4.7" />
      <path d="M3.5 16.7l8.5 4.7 8.5-4.7" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.8" width="17" height="12.2" rx="2" />
      <path d="M9 7.8V6.3A2.3 2.3 0 0 1 11.3 4h1.4A2.3 2.3 0 0 1 15 6.3v1.5" />
      <path d="M3.5 12.8h17" />
      <path d="M12 11.4v2.8" />
    </>
  ),
}

export default function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
