import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rng, glowTexture } from './palette.js'

/* ============================================================
   The human constellation — every point of light is a builder.
   Nodes drift, neural pathways link neighbours, and bright
   pulses of intent travel every edge.
   ============================================================ */

const NODE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.22 + aPhase) * 1.4;
    p.y += cos(uTime * 0.18 + aPhase * 1.7) * 1.2;
    p.z += sin(uTime * 0.15 + aPhase * 2.3) * 1.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = min(aSize * uPixel * (170.0 / max(1.0, -mv.z)), 52.0);
    vColor = aColor;
    vPulse = 0.7 + 0.3 * sin(uTime * 1.1 + aPhase * 5.0);
    gl_Position = projectionMatrix * mv;
  }
`
const NODE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    gl_FragColor = vec4(vColor, a * vPulse);
  }
`

const PULSE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aOffset;
  attribute float aSpeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float f = fract(uTime * aSpeed + aOffset);
    vec3 p = mix(aStart, aEnd, f);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = min(2.2 * uPixel * (170.0 / max(1.0, -mv.z)), 34.0);
    vColor = aColor;
    vFade = sin(f * 3.14159); // bright mid-flight, born & dies gently
    gl_Position = projectionMatrix * mv;
  }
`
const PULSE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    gl_FragColor = vec4(vColor, a * vFade);
  }
`

function buildGraph(count) {
  const r = rng(4242)
  const nodes = []
  for (let i = 0; i < count; i++) {
    nodes.push(
      new THREE.Vector3(
        (r() - 0.5) * 170,
        -22 + r() * 62,
        30 - r() * 350 // spread across the whole journey corridor
      )
    )
  }
  // connect each node to its 2 nearest neighbours within reach
  const edges = []
  const seen = new Set()
  for (let i = 0; i < count; i++) {
    const near = []
    for (let j = 0; j < count; j++) {
      if (i === j) continue
      const d = nodes[i].distanceTo(nodes[j])
      if (d < 34) near.push([d, j])
    }
    near.sort((a, b) => a[0] - b[0])
    for (const [, j] of near.slice(0, 2)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([i, j])
      }
    }
  }
  return { nodes, edges }
}

export default function Constellation({ count = 260 }) {
  const nodeMat = useRef()
  const pulseMat = useRef()

  const { nodeGeo, lineGeo, pulseGeo } = useMemo(() => {
    const r = rng(1313)
    const { nodes, edges } = buildGraph(count)

    // -- node points
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const faint = new THREE.Color('#8f93a8')
    const crimson = new THREE.Color('#ff2740')
    const bright = new THREE.Color('#ffffff')
    for (let i = 0; i < count; i++) {
      nodes[i].toArray(positions, i * 3)
      const roll = r()
      const c = roll < 0.72 ? faint : roll < 0.92 ? crimson : bright
      c.toArray(colors, i * 3)
      sizes[i] = roll < 0.92 ? 1.1 + r() * 1.4 : 2.2 + r() * 1.6
      phases[i] = r() * Math.PI * 2
    }
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    nodeGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    nodeGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))

    // -- edge lines
    const linePos = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], k) => {
      nodes[a].toArray(linePos, k * 6)
      nodes[b].toArray(linePos, k * 6 + 3)
    })
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))

    // -- pulses travelling the edges
    const pulseCount = Math.min(340, edges.length * 2)
    const pStart = new Float32Array(pulseCount * 3)
    const pEnd = new Float32Array(pulseCount * 3)
    const pOffset = new Float32Array(pulseCount)
    const pSpeed = new Float32Array(pulseCount)
    const pColor = new Float32Array(pulseCount * 3)
    const pc1 = new THREE.Color('#ff5b6e')
    const pc2 = new THREE.Color('#cdd3ff')
    for (let i = 0; i < pulseCount; i++) {
      const [a, b] = edges[Math.floor(r() * edges.length)]
      const flip = r() > 0.5
      nodes[flip ? a : b].toArray(pStart, i * 3)
      nodes[flip ? b : a].toArray(pEnd, i * 3)
      pOffset[i] = r()
      pSpeed[i] = 0.05 + r() * 0.16
      ;(r() < 0.6 ? pc1 : pc2).toArray(pColor, i * 3)
    }
    const pulseGeo = new THREE.BufferGeometry()
    // position attr is required by three even though the shader ignores it
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3))
    pulseGeo.setAttribute('aStart', new THREE.BufferAttribute(pStart, 3))
    pulseGeo.setAttribute('aEnd', new THREE.BufferAttribute(pEnd, 3))
    pulseGeo.setAttribute('aOffset', new THREE.BufferAttribute(pOffset, 1))
    pulseGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1))
    pulseGeo.setAttribute('aColor', new THREE.BufferAttribute(pColor, 3))
    return { nodeGeo, lineGeo, pulseGeo }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const px = state.gl.getPixelRatio()
    if (nodeMat.current) {
      nodeMat.current.uniforms.uTime.value = t
      nodeMat.current.uniforms.uPixel.value = px
    }
    if (pulseMat.current) {
      pulseMat.current.uniforms.uTime.value = t
      pulseMat.current.uniforms.uPixel.value = px
    }
  })

  return (
    <group>
      <points geometry={nodeGeo} frustumCulled={false}>
        <shaderMaterial
          ref={nodeMat}
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          uniforms={{ uTime: { value: 0 }, uPixel: { value: 1 }, uMap: { value: glowTexture() } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial
          color="#5a4757"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points geometry={pulseGeo} frustumCulled={false}>
        <shaderMaterial
          ref={pulseMat}
          vertexShader={PULSE_VERT}
          fragmentShader={PULSE_FRAG}
          uniforms={{ uTime: { value: 0 }, uPixel: { value: 1 }, uMap: { value: glowTexture() } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
