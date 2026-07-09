import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Starfield, Nebula } from './Starfield.jsx'
import AICore from './AICore.jsx'
import Constellation from './Constellation.jsx'
import Islands from './Islands.jsx'
import Streams from './Streams.jsx'
import CameraRig from './CameraRig.jsx'
import { webglAvailable } from './worldState.js'

/* ============================================================
   The Brivia universe — one fixed, full-screen WebGL canvas
   living behind the entire journey.
   ============================================================ */

export default function WorldCanvas({ onReady }) {
  const [ok] = useState(webglAvailable)
  const [lowPower] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 760px)').matches || navigator.hardwareConcurrency <= 4)
  )

  if (!ok) {
    // graceful fallback — a still, starry gradient
    if (onReady) onReady()
    return <div className="world-canvas world-fallback" aria-hidden="true" />
  }

  return (
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        dpr={lowPower ? [1, 1.5] : [1, 1.8]}
        gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
        camera={{ fov: 58, near: 0.5, far: 1400, position: [0, 13, 44] }}
        onCreated={() => onReady && setTimeout(onReady, 350)}
      >
        <color attach="background" args={['#040407']} />
        <fog attach="fog" args={['#06060c', 70, 430]} />

        <hemisphereLight args={['#2a2040', '#050508', 0.85]} />
        <directionalLight position={[40, 80, 20]} intensity={0.5} color="#8f96c8" />

        <Suspense fallback={null}>
          <Nebula />
          <Starfield count={lowPower ? 1600 : 3200} />
          <Constellation count={lowPower ? 150 : 260} />
          <AICore />
          <Islands />
          <Streams />
        </Suspense>

        <CameraRig />

        {!lowPower && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.85}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.3}
              mipmapBlur
              radius={0.75}
            />
            <Vignette eskil={false} offset={0.18} darkness={0.82} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
