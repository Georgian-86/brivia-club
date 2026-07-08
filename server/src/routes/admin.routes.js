import { db } from '../db.js'
import { requireAdmin } from '../auth.js'
import { personCard } from '../serialize.js'

export default async function adminRoutes(app) {
  app.get('/api/admin/overview', { preHandler: requireAdmin }, async () => {
    const [users, communities, projects, openReports, events, premium] = await Promise.all([
      db.user.count(),
      db.community.count(),
      db.project.count(),
      db.report.count({ where: { status: { not: 'Resolved' } } }),
      db.event.count(),
      db.user.count({ where: { badges: { has: 'premium' } } }),
    ])
    return {
      stats: [
        { label: 'Total users', value: users.toLocaleString(), delta: 'live count' },
        { label: 'Active communities', value: communities, delta: 'all healthy' },
        { label: 'Live hackathons', value: 4, delta: '1 featured' },
        { label: 'Open reports', value: openReports, delta: openReports ? 'needs review' : 'queue clear' },
        { label: 'Premium subs', value: premium, delta: 'badge holders' },
        { label: 'Events listed', value: events, delta: 'this season' },
      ],
    }
  })

  app.get('/api/admin/reports', { preHandler: requireAdmin }, async () => {
    const rows = await db.report.findMany({ orderBy: { createdAt: 'desc' } })
    return { reports: rows }
  })

  app.patch('/api/admin/reports/:id', { preHandler: requireAdmin }, async (req) => {
    const report = await db.report.update({
      where: { id: req.params.id },
      data: { status: req.body?.status || 'Resolved' },
    })
    return { report }
  })

  app.get('/api/admin/users', { preHandler: requireAdmin }, async () => {
    const rows = await db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 8 })
    return {
      users: rows.map((u) => ({
        person: personCard(u),
        joined: u.createdAt,
        status: (u.verified || {}).college || (u.verified || {}).github ? 'Verified' : 'Pending',
        reports: 0,
      })),
    }
  })
}
