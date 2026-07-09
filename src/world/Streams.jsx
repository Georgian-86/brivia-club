import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ZONES, CORE_POS, MATCH_POS, CITY_POS, rng, glowTexture } from './palette.js'
import { world } from './worldState.js'

/* ============================================================
   Energy in motion — rivers of light that carry people, ideas
   and messages across the world; wandering light-creatures;
   and the shockwave that erupts whenever a match ignites.
   ============================================================ */

const SAMPLES = 720

function sampleCurve(points, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
    'catmullrom',
    0.5
  )
  const arr = new Float32Array((SAMPLES + 1) * 3)
  for (let i = 0; i <= SAMPLES; i++) {
    curve.getPoint(i / SAMPLES).toArray(arr, i * 3)
  }
  return arr
}

/* A river: particles flowing endlessly along a sampled curve */
function Stream({ samples, color, count = 220, speed = 0.014, size = 0.5, opacity = 0.8 }) {
  const points = useRef()
  const state = useMemo(() => {
    const r = rng(count * 7 + 13)
    const offsets = new Float32Array(count)
    const jitter = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      offsets[i] = r()
      jitter[i * 3] = (r() - 0.5) * 1.6
      jitter[i * 3 + 1] = (r() - 0.5) * 1.6
      jitter[i * 3 + 2] = (r() - 0.5) * 1.6
    }
    return { offsets, jitter, positions: new Float32Array(count * 3) }
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { offsets, jitter, positions } = state
    for (let i = 0; i < count; i++) {
      const f = (offsets[i] + t * speed) % 1
      const x = f * SAMPLES
      const i0 = Math.floor(x)
      const k = x - i0
      const a = i0 * 3
      const b = Math.min(i0 + 1, SAMPLES) * 3
      positions[i * 3] = samples[a] + (samples[b] - samples[a]) * k + jitter[i * 3]
      positions[i * 3 + 1] = samples[a + 1] + (samples[b + 1] - samples[a + 1]) * k + jitter[i * 3 + 1]
      positions[i * 3 + 2] = samples[a + 2] + (samples[b + 2] - samples[a + 2]) * k + jitter[i * 3 + 2]
    }
    if (points.current) points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture()}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* A living creature made of light — a comet head with a tapering tail */
function Wisp({ samples, color, speed = 0.03, trail = 90, phase = 0 }) {
  const points = useRef()
  const buffers = useMemo(
    () => ({
      positions: new Float32Array(trail * 3),
    }),
    [trail]
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase
    const { positions } = buffers
    for (let i = 0; i < trail; i++) {
      const f = ((t - i * 0.0022) % 1 + 1) % 1
      const x = f * SAMPLES
      const i0 = Math.floor(x)
      const k = x - i0
      const a = i0 * 3
      const b = Math.min(i0 + 1, SAMPLES) * 3
      positions[i * 3] = samples[a] + (samples[b] - samples[a]) * k
      positions[i * 3 + 1] = samples[a + 1] + (samples[b + 1] - samples[a + 1]) * k
      positions[i * 3 + 2] = samples[a + 2] + (samples[b + 2] - samples[a + 2]) * k
    }
    if (points.current) points.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture()}
        color={color}
        size={1.3}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* Shockwave + spark burst at the match amphitheatre, on loop while
   the visitor is inside the match/connect chapters */
function MatchBurst() {
  const ringFlat = useRef()
  const ringTilt = useRef()
  const sparks = useRef()
  const flash = useRef()
  const life = useRef(1.5)
  const sparkData = useMemo(() => {
    const r = rng(60321)
    const count = 160
    const dirs = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      v.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize()
      v.toArray(dirs, i * 3)
      speeds[i] = 8 + r() * 22
    }
    return { count, dirs, speeds, positions: new Float32Array(count * 3) }
  }, [])

  useFrame((_, dt) => {
    // active only around the match/connect part of the journey
    const m = world.stamps.match
    const c = world.stamps.connect
    const inZone = m && c && world.smooth > m.start - 0.02 && world.smooth < c.end + 0.02
    if (!inZone) {
      life.current = 1.5
      if (ringFlat.current) ringFlat.current.visible = false
      if (ringTilt.current) ringTilt.current.visible = false
      if (sparks.current) sparks.current.visible = false
      if (flash.current) flash.current.visible = false
      return
    }
    life.current += dt / 3.6 // one ignition every ~3.6s
    if (life.current > 1) life.current = 0
    const l = life.current
    const ease = 1 - Math.pow(1 - l, 3)
    const fade = Math.pow(1 - l, 1.6)

    if (ringFlat.current) {
      ringFlat.current.visible = true
      const s = 2 + ease * 74
      ringFlat.current.scale.set(s, s, s)
      ringFlat.current.material.opacity = fade * 0.85
    }
    if (ringTilt.current) {
      ringTilt.current.visible = true
      const s = 2 + ease * 52
      ringTilt.current.scale.set(s, s, s)
      ringTilt.current.material.opacity = fade * 0.5
    }
    if (flash.current) {
      flash.current.visible = true
      const s = 6 + ease * 30
      flash.current.scale.set(s, s, 1)
      flash.current.material.opacity = fade * 0.8
    }
    if (sparks.current) {
      sparks.current.visible = true
      const { count, dirs, speeds, positions } = sparkData
      for (let i = 0; i < count; i++) {
        const d = ease * speeds[i]
        positions[i * 3] = dirs[i * 3] * d
        positions[i * 3 + 1] = Math.abs(dirs[i * 3 + 1]) * d * 0.7 + ease * 2
        positions[i * 3 + 2] = dirs[i * 3 + 2] * d
      }
      sparks.current.geometry.attributes.position.needsUpdate = true
      sparks.current.material.opacity = fade
    }
  })

  return (
    <group position={MATCH_POS}>
      <mesh ref={ringFlat} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1, 96]} />
        <meshBasicMaterial
          color="#ff4257"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringTilt} rotation={[-Math.PI / 2.6, 0.4, 0]}>
        <ringGeometry args={[0.9, 1, 96]} />
        <meshBasicMaterial
          color="#ffd7dc"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <sprite ref={flash}>
        <spriteMaterial
          map={glowTexture()}
          color="#ff6b7c"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <points ref={sparks} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={glowTexture()}
          color="#ffb3bc"
          size={0.9}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* the two destined nodes hovering above the amphitheatre */}
      <sprite position={[-4.5, 4, 0]} scale={[5, 5, 1]}>
        <spriteMaterial map={glowTexture()} color="#ff2740" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[4.5, 4, 0]} scale={[5, 5, 1]}>
        <spriteMaterial map={glowTexture()} color="#cdd3ff" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

export default function Streams() {
  const [f, h, cr, mu, co] = ZONES.map((z) => z.pos)
  const rivers = useMemo(
    () => [
      {
        color: '#ff3a50',
        count: 240,
        speed: 0.011,
        samples: sampleCurve([
          [18, 4, 42],
          [4, 14, 4],
          CORE_POS,
          [f[0] + 6, f[1] + 8, f[2] + 14],
          [cr[0] + 8, cr[1] + 4, cr[2] + 10],
          [co[0] + 4, co[1] + 6, co[2] + 8],
          MATCH_POS,
        ]),
      },
      {
        color: '#7d86ff',
        count: 200,
        speed: 0.013,
        samples: sampleCurve([
          [-24, 20, 30],
          CORE_POS,
          [h[0] - 6, h[1] + 9, h[2] + 12],
          [mu[0] - 4, mu[1] + 10, mu[2] + 10],
          [MATCH_POS[0] + 8, MATCH_POS[1] + 10, MATCH_POS[2] + 6],
          CITY_POS,
        ]),
      },
      {
        color: '#39e0c0',
        count: 150,
        speed: 0.009,
        size: 0.42,
        opacity: 0.55,
        samples: sampleCurve([
          [40, -8, 20],
          [-30, 2, -60],
          [34, 16, -150],
          [co[0] - 8, co[1] + 12, co[2]],
          [CITY_POS[0] - 10, CITY_POS[1] + 26, CITY_POS[2] + 10],
        ]),
      },
    ],
    [] // world geography is static
  )

  const wisps = useMemo(
    () => [
      {
        color: '#ffb3bc',
        speed: 0.02,
        phase: 0.1,
        samples: sampleCurve(
          [
            [14, 8, 8],
            [30, 18, -30],
            [0, 34, -70],
            [-26, 16, -30],
          ],
          true
        ),
      },
      {
        color: '#b7a8ff',
        speed: 0.016,
        phase: 0.5,
        samples: sampleCurve(
          [
            [cr[0] + 14, cr[1] + 8, cr[2]],
            [cr[0], cr[1] + 18, cr[2] - 16],
            [cr[0] - 16, cr[1] + 6, cr[2]],
            [cr[0], cr[1] - 4, cr[2] + 16],
          ],
          true
        ),
      },
      {
        color: '#8ff5d2',
        speed: 0.024,
        phase: 0.8,
        samples: sampleCurve(
          [
            [MATCH_POS[0] + 16, MATCH_POS[1] + 6, MATCH_POS[2] + 8],
            [MATCH_POS[0], MATCH_POS[1] + 20, MATCH_POS[2] - 12],
            [MATCH_POS[0] - 18, MATCH_POS[1] + 4, MATCH_POS[2] + 4],
          ],
          true
        ),
      },
    ],
    []
  )

  return (
    <group>
      {rivers.map((s, i) => (
        <Stream key={i} {...s} />
      ))}
      {wisps.map((w, i) => (
        <Wisp key={i} {...w} />
      ))}
      <MatchBurst />
    </group>
  )
}
