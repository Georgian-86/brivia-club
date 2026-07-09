import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rng, glowTexture, NOISE_GLSL } from './palette.js'

/* ============================================================
   Deep space — twinkling star corridor + slow nebula dome
   ============================================================ */

const STAR_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aTint;
  varying vec3 vTint;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float size = aSize * uPixel * (160.0 / max(1.0, -mv.z));
    gl_PointSize = min(size, 40.0);
    vTint = aTint;
    vTwinkle = 0.62 + 0.38 * sin(uTime * (0.6 + aPhase) + aPhase * 41.0);
    gl_Position = projectionMatrix * mv;
  }
`
const STAR_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vTint;
  varying float vTwinkle;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    gl_FragColor = vec4(vTint, a * vTwinkle);
  }
`

export function Starfield({ count = 3200 }) {
  const mat = useRef()
  const { positions, sizes, phases, tints } = useMemo(() => {
    const r = rng(20260209)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const tints = new Float32Array(count * 3)
    const palette = [
      [1.0, 1.0, 1.0],
      [0.75, 0.8, 1.0],
      [1.0, 0.62, 0.66],
      [0.62, 0.9, 1.0],
    ]
    for (let i = 0; i < count; i++) {
      // a wide corridor of stars along the whole camera journey
      positions[i * 3] = (r() - 0.5) * 640
      positions[i * 3 + 1] = (r() - 0.5) * 340
      positions[i * 3 + 2] = 120 - r() * 780
      sizes[i] = 0.5 + Math.pow(r(), 3) * 2.6
      phases[i] = r() * Math.PI * 2
      const t = palette[Math.floor(r() * (r() < 0.82 ? 2 : 4))]
      tints[i * 3] = t[0]
      tints[i * 3 + 1] = t[1]
      tints[i * 3 + 2] = t[2]
    }
    return { positions, sizes, phases, tints }
  }, [count])

  useFrame((state) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime
      mat.current.uniforms.uPixel.value = state.gl.getPixelRatio()
    }
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={{
          uTime: { value: 0 },
          uPixel: { value: 1 },
          uMap: { value: glowTexture() },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const NEBULA_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const NEBULA_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vDir;
  ${NOISE_GLSL}
  void main() {
    vec3 d = normalize(vDir);
    float t = uTime * 0.008;
    float n1 = fbm(d * 2.3 + vec3(t, -t * 0.7, t * 0.4));
    float n2 = fbm(d * 3.6 + vec3(-t * 0.5, t * 0.3, 9.2));
    float n3 = fbm(d * 5.2 + vec3(4.1, t * 0.6, -2.7));

    vec3 col = vec3(0.012, 0.012, 0.022);
    col += vec3(0.34, 0.028, 0.075) * smoothstep(0.46, 0.92, n1) * 0.5; // crimson wisps
    col += vec3(0.075, 0.055, 0.24) * smoothstep(0.5, 0.95, n2) * 0.55; // indigo depth
    col += vec3(0.015, 0.1, 0.115) * smoothstep(0.6, 0.96, n3) * 0.3; // faint teal
    // milky-way style band tilted through the sky
    float band = 1.0 - abs(dot(d, normalize(vec3(0.35, 1.0, 0.22))));
    col += vec3(0.09, 0.05, 0.1) * pow(band, 6.0) * 0.7;
    // fade toward the "floor" of the universe
    col *= mix(0.45, 1.0, smoothstep(-0.5, 0.35, d.y));
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Nebula() {
  const mat = useRef()
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh position={[0, 0, -220]} frustumCulled={false}>
      <sphereGeometry args={[620, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={{ uTime: { value: 0 } }}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
