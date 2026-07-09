import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ZONES, CITY_POS, rng, glowTexture } from './palette.js'

/* ============================================================
   Floating zone islands — low-poly rock, glowing crystals,
   orbit ring, mist particles and a beacon column of light.
   Plus the "build" city that rises at the end of the journey.
   ============================================================ */

function makeRock(seed, radius = 7) {
  const geo = new THREE.IcosahedronGeometry(radius, 1)
  const r = rng(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  // weld-free displacement: same displacement for identical vertices via hashing
  const cache = new Map()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`
    let d = cache.get(key)
    if (!d) {
      d = 0.72 + r() * 0.55
      cache.set(key, d)
    }
    v.multiplyScalar(d)
    if (v.y < 0) {
      // taper the underside into a hanging root, like a torn-off piece of land
      v.x *= 0.62
      v.z *= 0.62
      v.y *= 1.9
    } else {
      v.y *= 0.55 // flatten the top into a plateau
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

function Crystals({ color, seed }) {
  const items = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: 6 }, (_, i) => ({
      pos: [(r() - 0.5) * 7, 1.6 + r() * 1.6, (r() - 0.5) * 7],
      scale: [0.5 + r() * 0.7, 1.4 + r() * 2.4, 0.5 + r() * 0.7],
      rot: [(r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.5],
      main: i === 0,
    }))
  }, [seed])
  return (
    <group>
      {items.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.main ? [1.1, 3.4, 1.1] : c.scale} rotation={c.rot}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.4}
            roughness={0.25}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Mist({ color, seed, count = 70 }) {
  const positions = useMemo(() => {
    const r = rng(seed)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const rad = 6 + r() * 9
      arr[i * 3] = Math.cos(a) * rad
      arr[i * 3 + 1] = -6 + r() * 10
      arr[i * 3 + 2] = Math.sin(a) * rad
    }
    return arr
  }, [seed, count])
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture()}
        color={color}
        size={0.85}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Island({ zone, index }) {
  const group = useRef()
  const inner = useRef()
  const ring = useRef()
  const rock = useMemo(() => makeRock(1000 + index * 97), [index])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.position.y = zone.pos[1] + Math.sin(t * 0.32 + index * 1.7) * 1.4
    }
    if (inner.current) inner.current.rotation.y = t * 0.05 * (index % 2 ? -1 : 1)
    if (ring.current) ring.current.rotation.z += dt * 0.12
  })

  return (
    <group ref={group} position={zone.pos}>
      <group ref={inner}>
        <mesh geometry={rock}>
          <meshStandardMaterial color="#191922" roughness={0.92} metalness={0.06} flatShading />
        </mesh>
        <Crystals color={zone.color} seed={2000 + index * 31} />
        <Mist color={zone.color} seed={3000 + index * 53} />
        {/* discovery beacon — a soft column of light reaching for the sky */}
        <mesh position={[0, 17, 0]}>
          <cylinderGeometry args={[0.35, 1.5, 30, 12, 1, true]} />
          <meshBasicMaterial
            color={zone.color}
            transparent
            opacity={0.09}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <group ref={ring} rotation={[Math.PI / 2.15, 0.12, 0]}>
        <mesh>
          <torusGeometry args={[11.5, 0.05, 6, 96]} />
          <meshBasicMaterial
            color={zone.color}
            transparent
            opacity={0.45}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <sprite scale={[30, 30, 1]} position={[0, -2, 0]}>
        <spriteMaterial
          map={glowTexture()}
          color={zone.color}
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight color={zone.color} intensity={950} distance={55} decay={2} position={[0, 6, 0]} />
    </group>
  )
}

/* The city of shipped things — glass monoliths rising out of the dark */
function BuildCity() {
  const group = useRef()
  const towers = useMemo(() => {
    const r = rng(909)
    return Array.from({ length: 26 }, () => {
      const h = 4 + Math.pow(r(), 2) * 26
      return {
        pos: [(r() - 0.5) * 70, h / 2 - 10, (r() - 0.5) * 46],
        scale: [1.4 + r() * 3.4, h, 1.4 + r() * 3.4],
        hot: r() < 0.3,
      }
    })
  }, [])
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = CITY_POS[1] + Math.sin(state.clock.elapsedTime * 0.25) * 0.6
    }
  })
  return (
    <group ref={group} position={CITY_POS}>
      {towers.map((tw, i) => (
        <mesh key={i} position={tw.pos} scale={tw.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#12121a"
            roughness={0.4}
            metalness={0.6}
            emissive={tw.hot ? '#ff2740' : '#3d4470'}
            emissiveIntensity={tw.hot ? 0.55 : 0.35}
          />
        </mesh>
      ))}
      <sprite scale={[90, 40, 1]} position={[0, 4, 0]}>
        <spriteMaterial
          map={glowTexture()}
          color="#5560c8"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight color="#6672ff" intensity={2600} distance={110} decay={2} position={[0, 22, 0]} />
    </group>
  )
}

export default function Islands() {
  return (
    <group>
      {ZONES.map((z, i) => (
        <Island key={z.id} zone={z} index={i} />
      ))}
      <BuildCity />
    </group>
  )
}
