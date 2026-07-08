import { useOutletContext } from 'react-router-dom'
import { AppIcon, Loading, PageHead, StatTile, BlockHead, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* ⚙ Admin Dashboard — live counts + real moderation queue */

const SEV = { High: 'hot', Medium: 'mid', Low: 'ok' }

export default function Admin() {
  const { me, toast } = useOutletContext()
  const overview = useApi('/admin/overview')
  const reports = useApi('/admin/reports')
  const users = useApi('/admin/users')

  if (me && me.role !== 'ADMIN') {
    return (
      <div className="pg">
        <div className="panel empty-panel">
          <AppIcon name="shield" size={26} />
          <h3>Admin only</h3>
          <p>This room needs an admin account. Everything you do here is audit-logged.</p>
        </div>
      </div>
    )
  }

  if (overview.loading || reports.loading || users.loading)
    return <Loading label="Opening the ops room…" />

  const resolve = async (r) => {
    await api(`/admin/reports/${r.id}`, { method: 'PATCH', body: { status: 'Resolved' } })
    toast(`${r.code} resolved — reporter notified`, 'shield')
    reports.refresh()
    overview.refresh()
  }

  const timeAgo = (at) => {
    const h = Math.max(1, Math.round((Date.now() - new Date(at)) / 3600e3))
    return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Admin"
        title={<>Club <span className="red">operations.</span></>}
        sub="Trust is the product — the moderation queue is the most important table in this room."
        actions={
          <span className="admin-scope">
            <AppIcon name="shield" size={13} /> Admin access · audit-logged
          </span>
        }
      />

      <div className="stat-row six">
        {overview.data.stats.map((s, i) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} delay={i * 60} />
        ))}
      </div>

      <section className="panel">
        <BlockHead icon="bell" title="Moderation queue" action={<span className="panel-hint">SLA: high severity &lt; 4h</span>} />
        <table className="table">
          <thead>
            <tr><th>Report</th><th>Target</th><th>Reason</th><th>Severity</th><th>Age</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {reports.data.reports.map((r) => (
              <tr key={r.id} className={r.status === 'Resolved' ? 'row-dim' : ''}>
                <td className="mono">{r.code}</td>
                <td>{r.target}</td>
                <td>{r.reason}</td>
                <td><span className={`sev ${SEV[r.severity]}`}>{r.severity}</span></td>
                <td>{timeAgo(r.createdAt)}</td>
                <td>{r.status}</td>
                <td>
                  {r.status !== 'Resolved' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => resolve(r)}>
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="admin-grid">
        <section className="panel">
          <BlockHead icon="users" title="Recent members" />
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Joined</th><th>Status</th><th>Reports</th></tr>
            </thead>
            <tbody>
              {users.data.users.map((row) => (
                <tr key={row.person.id}>
                  <td>
                    <span className="cell-person">
                      <img src={row.person.img} alt="" /> {row.person.name}
                      {row.status === 'Verified' && <VerifiedTick small />}
                    </span>
                  </td>
                  <td>{new Date(row.joined).toLocaleDateString([], { month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span className={`sev ${row.status === 'Verified' ? 'ok' : 'mid'}`}>{row.status}</span>
                  </td>
                  <td>{row.reports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <BlockHead icon="gear" title="Manage" />
          <div className="admin-manage">
            {[
              ['users', 'Users', 'Verification queue, bans, badges'],
              ['bot', 'Communities', 'Review, feature, archive'],
              ['zap', 'Hackathons', 'Organizer accounts, featured slots'],
              ['folder', 'Projects', 'Flagged listings, equity-term review'],
              ['calendar', 'Events', 'Listings, banners, promotion'],
              ['gem', 'Subscriptions', 'Premium accounts and billing'],
            ].map(([icon, title, sub]) => (
              <button className="manage-row" key={title} onClick={() => toast(`${title} panel ships with the ops sprint`, 'gear')}>
                <span className="mini-ic"><AppIcon name={icon} size={15} /></span>
                <div>
                  <strong>{title}</strong>
                  <span>{sub}</span>
                </div>
                <em aria-hidden="true">→</em>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
