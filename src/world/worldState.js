import { useEffect } from 'react'

/* ============================================================
   BRIVIA WORLD — frame-rate state bus
   Mutable module singleton: DOM listeners write, the WebGL
   loop reads every frame. No React re-renders involved.
   ============================================================ */

export const world = {
  scroll: 0, // raw page progress 0..1
  smooth: 0, // critically-damped copy (updated inside useFrame)
  mouse: { x: 0, y: 0 }, // -1..1, y up
  mouseSmooth: { x: 0, y: 0 },
  stamps: {}, // chapterId -> { start, end } page progress
  stampsVersion: 0,
  mobile: false,
  reduced: false,
}

// debugging handle (used by dev tooling to inspect/steer the camera)
if (typeof window !== 'undefined') window.__briviaWorld = world

export function measureChapters() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const stamps = {}
  document.querySelectorAll('[data-chapter]').forEach((el) => {
    stamps[el.dataset.chapter] = {
      start: el.offsetTop / max,
      end: (el.offsetTop + el.offsetHeight) / max,
    }
  })
  world.stamps = stamps
  world.stampsVersion++
}

/* progress stamp for a fraction f (0..1) of a chapter's own scroll span */
export function stampAt(chapter, f) {
  const s = world.stamps[chapter]
  if (!s) return null
  return s.start + f * (s.end - s.start)
}

/* Install page-level listeners once (scroll, pointer, layout observer). */
export function useWorldInput() {
  useEffect(() => {
    world.mobile = window.matchMedia('(max-width: 760px)').matches
    world.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      world.scroll = Math.min(1, Math.max(0, window.scrollY / max))
    }
    const onMove = (e) => {
      world.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      world.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onResize = () => {
      world.mobile = window.matchMedia('(max-width: 760px)').matches
      measureChapters()
      onScroll()
    }

    onScroll()
    measureChapters()
    // re-measure once fonts/images settle, and whenever the page height changes
    const t1 = setTimeout(measureChapters, 400)
    const t2 = setTimeout(measureChapters, 1600)
    const ro = new ResizeObserver(() => {
      measureChapters()
      onScroll()
    })
    ro.observe(document.body)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
