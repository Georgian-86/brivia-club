/** Public shapes — never leak password/email to other members. */

export function personCard(u, extras = {}) {
  return {
    id: u.id,
    name: u.name,
    role: u.roleTitle || 'Builder',
    org: u.org || u.campus || '',
    tag: u.tag,
    bio: u.bio || '',
    skills: u.skills || [],
    img: u.avatar,
    location: u.location || '',
    tz: u.timezone,
    lookingFor: u.lookingFor || '',
    availability: u.availability || '',
    badges: u.badges || [],
    video: u.hasVideo,
    online: u.online,
    communities: extras.communities || [],
    match: extras.match ?? null,
    why: extras.why ?? [],
  }
}

export function fullMe(u) {
  const { password, ...rest } = u
  return rest
}
