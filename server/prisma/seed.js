/* Seed — ports the design-phase mock data (src/app/appData.js) into
   Postgres so the product launches with a living, coherent network.
   Demo login: mohit@brivia.club / brivia123 (admin). Every seeded
   member logs in with <handle>@brivia.club / brivia123. */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  ME, PEOPLE, COMMUNITIES, COMMUNITY_POSTS, EVENTS, PROJECTS, JOBS,
  CONVERSATIONS, REQUESTS, INVITATIONS, NOTIFICATIONS, ADMIN_REPORTS,
} from '../../src/app/appData.js'
import { computeStrength } from '../src/routes/auth.routes.js'

const db = new PrismaClient()
const ago = (h) => new Date(Date.now() - h * 3600e3)
const pairIds = (a, b) => (a < b ? [a, b] : [b, a])

const COMM_SLUG = {
  ai: 'ai', hackathons: 'hackathons', startups: 'startups', music: 'music',
  design: 'design', 'open source': 'opensource', creators: 'photography',
}

async function main() {
  // wipe in dependency order — idempotent reseeds
  const tables = [
    'message', 'match', 'swipe', 'connectionRequest', 'invitation', 'postLike', 'post',
    'communityMember', 'community', 'rsvp', 'event', 'application', 'project',
    'jobApplication', 'job', 'savedItem', 'notification', 'profileView', 'report', 'user',
  ]
  for (const t of tables) await db[t].deleteMany()

  const password = await bcrypt.hash('brivia123', 10)

  /* ---------- users ---------- */
  const meData = {
    email: 'mohit@brivia.club', password, role: 'ADMIN', handle: 'mohit',
    name: ME.name, headline: ME.headline, bio: ME.bio, roleTitle: ME.role,
    org: ME.company, campus: ME.campus, location: ME.location, timezone: 'IST',
    avatar: ME.avatar, cover: ME.cover, tag: 'Startup',
    skills: ME.skills, interests: ME.interests, languages: ME.languages,
    personality: ME.personality, industries: ME.industries, purposes: ['startup'],
    lookingFor: ME.startup.looking, availability: ME.availability, workStyle: ME.workStyle,
    openToWork: ME.openToWork, openToCollab: ME.openToCollab, hasVideo: false,
    verified: ME.verified, badges: ME.badges, experience: ME.experience,
    education: ME.education, achievements: ME.achievements, certifications: ME.certifications,
    startup: ME.startup, socials: ME.socials,
  }
  const mohit = await db.user.create({
    data: { ...meData, profileStrength: computeStrength(meData) },
  })

  const users = { mohit }
  for (const p of PEOPLE) {
    const data = {
      email: `${p.id}@brivia.club`, password, handle: p.id,
      name: p.name, roleTitle: p.role, org: p.org, tag: p.tag,
      bio: p.bio, skills: p.skills, avatar: p.img, location: p.location,
      timezone: 'IST', lookingFor: p.lookingFor, availability: p.availability,
      interests: p.communities, badges: p.badges || [], hasVideo: p.video,
      online: p.online, headline: p.bio.split('.')[0] + '.',
      verified: { email: true, github: true, college: (p.badges || []).includes('verified') },
      campus: p.org,
    }
    users[p.id] = await db.user.create({
      data: { ...data, profileStrength: computeStrength(data) },
    })
  }

  /* ---------- communities + memberships + posts ---------- */
  const comms = {}
  for (const c of COMMUNITIES) {
    comms[c.id] = await db.community.create({
      data: { slug: c.id, name: c.name, blurb: c.blurb, icon: c.icon, banner: c.banner, trending: c.trending },
    })
    if (c.joined) await db.communityMember.create({ data: { userId: mohit.id, communityId: comms[c.id].id } })
  }
  for (const p of PEOPLE) {
    for (const name of p.communities) {
      const slug = COMM_SLUG[name.toLowerCase()]
      if (slug && comms[slug])
        await db.communityMember.create({
          data: { userId: users[p.id].id, communityId: comms[slug].id },
        }).catch(() => {})
    }
  }
  const postAges = [2, 5, 24, 26]
  for (const [i, post] of COMMUNITY_POSTS.entries()) {
    await db.post.create({
      data: {
        communityId: comms[post.community].id, authorId: users[post.author].id,
        kind: post.kind, title: post.title, body: post.body,
        replies: post.replies, likesBase: post.likes, createdAt: ago(postAges[i] ?? 24),
      },
    })
  }

  /* ---------- events / projects / jobs ---------- */
  const events = {}
  for (const e of EVENTS) {
    events[e.id] = await db.event.create({
      data: {
        slug: e.id, kind: e.kind, name: e.name, date: e.date, location: e.location,
        prize: e.prize, img: e.img, blurb: e.blurb, featured: e.featured, going: e.going,
      },
    })
    if (e.rsvp) await db.rsvp.create({ data: { userId: mohit.id, eventId: events[e.id].id } })
  }
  for (const p of PROJECTS) {
    await db.project.create({
      data: {
        name: p.name, blurb: p.blurb, banner: p.banner, ownerId: users[p.owner].id,
        roles: p.roles, stack: p.stack, timeline: p.timeline, difficulty: p.difficulty,
        pay: p.pay, equity: p.equity, applicantsBase: p.applicants,
      },
    })
  }
  for (const j of JOBS) {
    await db.job.create({
      data: {
        title: j.title, org: j.org, type: j.type, mode: j.mode, pay: j.pay,
        tags: j.tags, hot: j.hot, applicantsBase: j.applicants, postedLabel: j.posted,
      },
    })
  }

  /* ---------- matches + message history ---------- */
  for (const convo of CONVERSATIONS) {
    const other = users[convo.id]
    const person = PEOPLE.find((p) => p.id === convo.id)
    const [userAId, userBId] = pairIds(mohit.id, other.id)
    const match = await db.match.create({
      data: { userAId, userBId, score: person.match, why: person.why, createdAt: ago(72) },
    })
    let t = ago(26)
    const stamps = []
    for (const m of convo.thread) {
      t = new Date(t.getTime() + 25 * 60e3)
      stamps.push(t)
      await db.message.create({
        data: {
          matchId: match.id,
          senderId: m.from === 'me' ? mohit.id : other.id,
          kind: m.code ? 'CODE' : 'TEXT',
          body: m.code || m.text,
          createdAt: t,
        },
      })
    }
    // leave the final incoming messages unread for the demo user
    const unreadFrom = Math.max(0, convo.thread.length - (convo.unread || 0))
    const mySeen = convo.unread ? new Date(stamps[unreadFrom - 1] ?? stamps[0]) : new Date()
    const meIsA = userAId === mohit.id
    await db.match.update({
      where: { id: match.id },
      data: meIsA ? { lastSeenA: mySeen, lastSeenB: new Date() } : { lastSeenB: mySeen, lastSeenA: new Date() },
    })
  }

  /* ---------- incoming interest (so right-swipes match instantly) ---------- */
  for (const handle of ['ananya', 'meera', 'zoya', 'dev']) {
    await db.swipe.create({
      data: { swiperId: users[handle].id, targetId: mohit.id, action: 'LIKE', createdAt: ago(20) },
    })
  }

  /* ---------- requests + invitations ---------- */
  for (const r of REQUESTS) {
    await db.connectionRequest.create({ data: { fromId: users[r.id].id, toId: mohit.id, note: r.note } })
  }
  for (const inv of INVITATIONS) {
    await db.invitation.create({
      data: {
        kind: inv.kind, fromId: users[inv.from].id, toId: mohit.id,
        title: inv.title, detail: inv.detail, icon: inv.icon,
      },
    })
  }

  /* ---------- notifications ---------- */
  const notifAges = [0.05, 0.15, 1, 3, 6, 24, 48]
  for (const [i, n] of NOTIFICATIONS.entries()) {
    await db.notification.create({
      data: {
        userId: mohit.id, kind: n.kind, text: n.text, read: !n.unread,
        actorId: n.person ? users[n.person].id : null, createdAt: ago(notifAges[i] ?? 24),
      },
    })
  }

  /* ---------- profile views (analytics fuel) ---------- */
  const cast = Object.values(users).filter((u) => u.id !== mohit.id)
  const viewRows = Array.from({ length: 260 }, () => ({
    viewerId: cast[Math.floor(Math.random() * cast.length)].id,
    targetId: mohit.id,
    createdAt: new Date(Date.now() - Math.random() * 30 * 86400e3),
  }))
  await db.profileView.createMany({ data: viewRows })

  /* ---------- moderation queue ---------- */
  for (const r of ADMIN_REPORTS) {
    await db.report.create({
      data: { code: r.id, target: r.target, reason: r.reason, severity: r.severity, status: r.status },
    })
  }

  /* ---------- starter saved items ---------- */
  await db.savedItem.create({ data: { userId: mohit.id, itemType: 'person', refId: users.isha.id } })
  await db.savedItem.create({ data: { userId: mohit.id, itemType: 'event', refId: events.hackbengaluru.id } })

  const counts = await Promise.all([db.user.count(), db.match.count(), db.message.count(), db.post.count()])
  console.log(`Seeded: ${counts[0]} users, ${counts[1]} matches, ${counts[2]} messages, ${counts[3]} posts`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
