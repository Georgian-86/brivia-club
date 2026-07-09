import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ZONES, CORE_POS, MATCH_POS, CITY_POS } from './palette.js'
import { world, stampAt } from './worldState.js'

/* ============================================================
   The camera flight — a keyframed journey through the world,
   driven by damped scroll, seasoned with idle drift and
   pointer parallax so the frame is never still.
   ============================================================ */

const off = (p, dx, dy, dz) => [p[0] + dx, p[1] + dy, p[2] + dz]
const [FOUNDER, HACKATHON, CREATOR, MUSIC, COMMUNITY] = ZONES.map((z) => z.pos)

/* Each key: chapter id + fraction of that chapter's scroll span */
const KEYS = [
  { c: 'hero', f: 0.0, pos: [0, 13, 44], look: off(CORE_POS, 0, -8, 0) },
  { c: 'hero', f: 0.95, pos: [9, 11, 32], look: off(CORE_POS, 0, -10, 0) },
  { c: 'alone', f: 0.55, pos: [17, 8, 13], look: [9, 5, -4] },
  { c: 'engine', f: 0.3, pos: [7, 15, -10], look: CORE_POS },
  { c: 'engine', f: 0.95, pos: [-8, 27, -26], look: CORE_POS },
  /* look targets pan toward the copy panel's side so the island composes off-centre */
  { c: 'zone-founder', f: 0.55, pos: off(FOUNDER, 17, 6, 26), look: off(FOUNDER, 4, 2, 0) },
  { c: 'zone-hackathon', f: 0.55, pos: off(HACKATHON, -16, 4, 25), look: off(HACKATHON, -4, 3, 0) },
  { c: 'zone-creator', f: 0.55, pos: off(CREATOR, 16, 4, 25), look: off(CREATOR, 4, 3, 0) },
  { c: 'zone-music', f: 0.55, pos: off(MUSIC, -15, 5, 24), look: off(MUSIC, -4, 2, 0) },
  { c: 'zone-community', f: 0.55, pos: off(COMMUNITY, -16, 5, 25), look: off(COMMUNITY, 4, 3, 0) },
  { c: 'match', f: 0.45, pos: off(MATCH_POS, 0, 3, 30), look: off(MATCH_POS, 0, 2, 0) },
  { c: 'connect', f: 0.55, pos: off(MATCH_POS, 12, 7, 18), look: off(MATCH_POS, 0, 6, -10) },
  { c: 'build', f: 0.55, pos: off(CITY_POS, -8, 38, 62), look: off(CITY_POS, 0, 4, 0) },
  { c: 'cta', f: 0.6, pos: [0, 58, -34], look: [0, 6, -185] },
]

/* Fallback track used before chapter measurement lands */
const FALLBACK = KEYS.map((k, i) => ({ ...k, at: (i / (KEYS.length - 1)) * 0.9 }))

const smoothstep = (x) => x * x * (3 - 2 * x)

export default function CameraRig() {
  const track = useRef(FALLBACK)
  const version = useRef(-1)
  const pos = useRef(new THREE.Vector3(...KEYS[0].pos))
  const look = useRef(new THREE.Vector3(...KEYS[0].look))
  const tmpA = useRef(new THREE.Vector3())
  const tmpB = useRef(new THREE.Vector3())

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const t = state.clock.elapsedTime

    // rebuild keyframe stamps when the page layout was (re)measured
    if (version.current !== world.stampsVersion) {
      version.current = world.stampsVersion
      const resolved = KEYS.map((k) => ({ ...k, at: stampAt(k.c, k.f) })).filter(
        (k) => k.at !== null
      )
      if (resolved.length >= 2) track.current = resolved
    }

    // damp raw scroll & pointer
    world.smooth = THREE.MathUtils.damp(world.smooth, world.scroll, 3.2, dt)
    world.mouseSmooth.x = THREE.MathUtils.damp(world.mouseSmooth.x, world.mouse.x, 2.4, dt)
    world.mouseSmooth.y = THREE.MathUtils.damp(world.mouseSmooth.y, world.mouse.y, 2.4, dt)

    // locate the current segment on the track
    const keys = track.current
    const p = world.smooth
    let i = 0
    while (i < keys.length - 2 && p > keys[i + 1].at) i++
    const a = keys[i]
    const b = keys[i + 1]
    const span = Math.max(1e-5, b.at - a.at)
    const k = smoothstep(THREE.MathUtils.clamp((p - a.at) / span, 0, 1))

    tmpA.current.fromArray(a.pos).lerp(tmpB.current.fromArray(b.pos), k)
    pos.current.copy(tmpA.current)
    tmpA.current.fromArray(a.look).lerp(tmpB.current.fromArray(b.look), k)
    look.current.copy(tmpA.current)

    // idle drift — the world breathes even when the visitor doesn't scroll
    const drift = world.reduced ? 0 : 1
    pos.current.x += Math.sin(t * 0.11) * 0.9 * drift
    pos.current.y += Math.sin(t * 0.16 + 2) * 0.5 * drift

    // pointer parallax — the environment leans with the cursor
    const mx = world.mouseSmooth.x
    const my = world.mouseSmooth.y
    look.current.x += mx * 3.4 * drift
    look.current.y += my * 1.8 * drift
    pos.current.x += mx * 1.1 * drift
    pos.current.y += my * 0.6 * drift

    state.camera.position.copy(pos.current)
    state.camera.lookAt(look.current)
    state.camera.rotation.z += mx * 0.012 * drift // a whisper of cinematic roll
  })

  return null
}
