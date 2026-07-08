import { useOutletContext } from 'react-router-dom'
import { AppIcon, BlockHead, Loading, PageHead, VerifiedTick } from '../ui.jsx'
import { api, useApi } from '../api.js'

/* 🤝 Communities — joining feeds the matching engine */

const timeAgo = (at) => {
  const h = Math.max(1, Math.round((Date.now() - new Date(at)) / 3600e3))
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`
}

export default function Communities() {
  const { toast } = useOutletContext()
  const comms = useApi('/communities')
  const posts = useApi('/posts')

  if (comms.loading || posts.loading) return <Loading label="Finding your scenes…" />

  const toggle = async (c) => {
    const { joined } = await api(`/communities/${c.id}/toggle`, { method: 'POST' })
    toast(
      joined ? `Joined ${c.name} — your recommendations just got sharper` : `Left ${c.name}`,
      joined ? 'sparkle' : 'x'
    )
    comms.refresh()
  }

  const like = async (post) => {
    await api(`/posts/${post.id}/like`, { method: 'POST' })
    posts.refresh()
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Communities"
        title={<>Find your <span className="red">scenes.</span></>}
        sub="Posts, discussions, events and resources — and every community you join teaches the matching engine what you care about."
      />

      <div className="comm-grid">
        {comms.data.communities.map((c) => (
          <article className="comm-card" key={c.id}>
            <div className="comm-banner" style={{ backgroundImage: `url(${c.banner})` }}>
              {c.trending && (
                <span className="comm-trend"><AppIcon name="flame" size={11} /> Trending</span>
              )}
              <span className="comm-ic"><AppIcon name={c.icon} size={17} /></span>
            </div>
            <div className="comm-body">
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
              <div className="comm-meta">
                <span><AppIcon name="users" size={12} /> {c.members.toLocaleString()}</span>
                <span><AppIcon name="chat" size={12} /> {c.posts}/wk</span>
              </div>
              <button
                className={`btn btn-sm btn-block ${c.joined ? 'btn-ghost' : 'btn-red'}`}
                onClick={() => toggle(c)}
              >
                {c.joined ? <><AppIcon name="check" size={13} /> Joined</> : 'Join'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="panel feed-panel">
        <BlockHead icon="chat" title="Latest from your communities" />
        {posts.data.posts.map((post) => (
          <article className="post-row" key={post.id}>
            <img className="post-ava" src={post.author.img} alt="" />
            <div className="post-body">
              <div className="post-meta">
                <strong>{post.author.name}</strong>
                {post.author.badges?.includes('verified') && <VerifiedTick small />}
                <span>in {post.community} · {timeAgo(post.time)} ago</span>
                <em className="post-kind">{post.kind}</em>
              </div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div className="post-actions">
                <button className={`text-btn${post.liked ? ' liked' : ''}`} onClick={() => like(post)}>
                  <AppIcon name="heart" size={13} /> {post.likes}
                </button>
                <button className="text-btn" onClick={() => toast('Threads open with community rooms', 'chat')}>
                  <AppIcon name="chat" size={13} /> {post.replies} replies
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
