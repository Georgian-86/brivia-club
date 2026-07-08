import { useMemo, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { AppIcon, Loading, PageHead, PersonCard } from '../ui.jsx'
import { api, useApi } from '../api.js'
import { SEARCH_SUGGESTIONS } from '../appData.js'

/* 🔍 Smart Search — natural-language queries answered by the API */

const FILTERS = ['All', 'Startup', 'Hackathon', 'Music', 'Creator', 'Mentor', 'Side Project']

export default function Search() {
  const [params, setParams] = useSearchParams()
  const { save, isSaved, toast } = useOutletContext()
  const [filter, setFilter] = useState('All')
  const query = params.get('q') || ''
  const [input, setInput] = useState(query)

  const { data, loading } = useApi(`/search?q=${encodeURIComponent(query)}`)

  const results = useMemo(() => {
    const base = data?.results || []
    return filter === 'All' ? base : base.filter((p) => p.tag === filter)
  }, [data, filter])

  const submit = (e) => {
    e.preventDefault()
    setParams(input.trim() ? { q: input.trim() } : {})
  }

  const connect = async (p) => {
    await api('/requests', { method: 'POST', body: { toId: p.id } })
    toast(`Connection request sent to ${p.name}`, 'heart')
  }

  return (
    <div className="pg">
      <PageHead
        kicker="Smart Search"
        title={<>Search like you <span className="red">talk.</span></>}
        sub="Semantic search over the whole club — describe who you need, the AI handles the filters."
      />

      <form className="search-hero" onSubmit={submit}>
        <AppIcon name="search" size={18} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='"Female founders in fintech" · "Pianists" · "UI designers open to equity"'
          aria-label="Smart search query"
        />
        <button className="btn btn-red" type="submit">
          <AppIcon name="sparkle" size={14} /> Search
        </button>
      </form>

      <div className="search-suggest">
        <span>Try:</span>
        {SEARCH_SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="chip chip-btn"
            onClick={() => {
              setInput(s)
              setParams({ q: s })
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`pill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="filter-count">
          {results.length} builder{results.length === 1 ? '' : 's'}
          {query && <> for “{query}”</>}
        </span>
      </div>

      {loading ? (
        <Loading label="Searching the club…" />
      ) : results.length === 0 ? (
        <div className="panel empty-panel">
          <AppIcon name="search" size={26} />
          <h3>No builders matched that</h3>
          <p>Loosen the filter or try a broader phrase — the club grows every day.</p>
        </div>
      ) : (
        <div className="card-grid three">
          {results.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              onSave={(pid) => save('person', pid)}
              saved={isSaved('person', p.id)}
              action={
                <button className="btn btn-red btn-sm" onClick={() => connect(p)}>
                  Connect
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
