import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CORE_POS, rng, glowTexture, NOISE_GLSL } from './palette.js'

/* ============================================================
   The AI Core — a living organ of noise, fresnel light and
   orbiting matter, suspended above the whole world
   ============================================================ */

const CORE_VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;
  ${NOISE_GLSL}
  void main() {
    float n = fbm(normalize(position) * 1.7 + vec3(uTime * 0.1, uTime * 0.07, 0.0));
    vec3 p = position + normal * (n - 0.45) * 3.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz;
    vNoise = n;
    gl_Position = projectionMatrix * mv;
  }
`
const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.4);
    vec3 col = vec3(0.06, 0.012, 0.022);
    col += vec3(1.0, 0.15, 0.25) * (fres * 1.5 + smoothstep(0.55, 0.85, vNoise) * 0.55) * pulse;
    col += vec3(1.0, 0.85, 0.8) * pow(fres, 4.0) * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`

function CoreShell() {
  const mat = useRef()
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh>
      <icosahedronGeometry args={[8, 24]} />
      <shaderMaterial
        ref={mat}
        vertexShader={CORE_VERT}
        fragmentShader={CORE_FRAG}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  )
}

function CoreRings() {
  const g1 = useRef()
  const g2 = useRef()
  const g3 = useRef()
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (g1.current) g1.current.rotation.z += dt * 0.22
    if (g2.current) g2.current.rotation.z -= dt * 0.15
    if (g3.current) {
      g3.current.rotation.z += dt * 0.1
      g3.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.25) * 0.12
    }
  })
  const ring = (r) => <torusGeometry args={[r, 0.07, 8, 128]} />
  return (
    <>
      <group ref={g1} rotation={[Math.PI / 2.2, 0.2, 0]}>
        <mesh>
          {ring(12.5)}
          <meshBasicMaterial
            color="#ff2740"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={g2} rotation={[Math.PI / 1.9, -0.35, 0.4]}>
        <mesh>
          {ring(16)}
          <meshBasicMaterial
            color="#ff8a96"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={g3} rotation={[Math.PI / 2.4, 0.1, 0]}>
        <mesh>
          {ring(20)}
          <meshBasicMaterial
            color="#7d86ff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  )
}

function CoreOrbiters({ count = 520 }) {
  const points = useRef()
  const data = useMemo(() => {
    const r = rng(777)
    const radius = new Float32Array(count)
    const angle = new Float32Array(count)
    const speed = new Float32Array(count)
    const tilt = new Float32Array(count)
    const yoff = new Float32Array(count)
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      radius[i] = 10.5 + r() * 13
      angle[i] = r() * Math.PI * 2
      speed[i] = (0.08 + r() * 0.35) * (r() > 0.5 ? 1 : -1)
      tilt[i] = (r() - 0.5) * 0.9
      yoff[i] = (r() - 0.5) * 5
    }
    return { radius, angle, speed, tilt, yoff, positions }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { radius, angle, speed, tilt, yoff, positions } = data
    for (let i = 0; i < count; i++) {
      const a = angle[i] + t * speed[i]
      const x = Math.cos(a) * radius[i]
      const z = Math.sin(a) * radius[i]
      positions[i * 3] = x
      positions[i * 3 + 1] = yoff[i] + x * tilt[i] * 0.4 + Math.sin(t * 0.7 + i) * 0.4
      positions[i * 3 + 2] = z
    }
    if (points.current) points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture()}
        color="#ff5b6e"
        size={0.55}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function AICore() {
  const group = useRef()
  const halo = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.position.y = CORE_POS[1] + Math.sin(t * 0.4) * 1.2 // breathing hover
      group.current.rotation.y = t * 0.06
    }
    if (halo.current) {
      const s = 58 + Math.sin(t * 0.8) * 4
      halo.current.scale.set(s, s, 1)
    }
  })
  return (
    <group ref={group} position={CORE_POS}>
      <CoreShell />
      {/* hot inner heart */}
      <mesh>
        <icosahedronGeometry args={[4.4, 3]} />
        <meshBasicMaterial color="#ff4257" />
      </mesh>
      <CoreRings />
      <CoreOrbiters />
      <sprite ref={halo} scale={[58, 58, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ff2740"
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight color="#ff3a50" intensity={5200} distance={230} decay={2} />
    </group>
  )
}
