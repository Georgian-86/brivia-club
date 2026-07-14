import { createHash } from 'node:crypto'

/* ============================================================
   Profile → text. Every member becomes TWO documents:

   profileDoc — who I am   (bio, skills, interests, craft)
   intentDoc  — who I want (purposes, lookingFor, availability)

   The engine matches them CROSS-WISE: my intent against their
   profile and their intent against mine. That bidirectional fit
   is what makes this team formation, not people similarity.
   ============================================================ */

const line = (label, v) => {
  const s = Array.isArray(v) ? v.filter(Boolean).join(', ') : `${v || ''}`.trim()
  return s ? `${label}: ${s}` : null
}

export function profileDoc(u) {
  return [
    line('Role', u.roleTitle),
    line('Headline', u.headline),
    line('About', u.bio),
    line('Skills', u.skills),
    line('Interests', u.interests),
    line('Industries', u.industries),
    line('Personality', u.personality),
    line('Work style', u.workStyle),
    line('Organization', u.org),
    line('Campus', u.campus),
    line('Location', u.location),
  ]
    .filter(Boolean)
    .join('\n')
}

export function intentDoc(u) {
  return [
    line('Here to build', [u.tag, ...(u.purposes || [])]),
    line('Looking for', u.lookingFor),
    line('Availability', u.availability),
    line('Open to collaboration', u.openToCollab ? 'yes' : ''),
    line('Open to work', u.openToWork ? 'yes' : ''),
  ]
    .filter(Boolean)
    .join('\n')
}

/** Change detector — profile edits that don't touch these docs skip the re-embed. */
export function textHash(u, provider) {
  return createHash('sha256').update(`${provider}\n${profileDoc(u)}\n---\n${intentDoc(u)}`).digest('hex')
}
