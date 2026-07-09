import * as THREE from 'three'

/* ============================================================
   BRIVIA WORLD — shared palette, world map & GPU helpers
   ============================================================ */

export const CORE_POS = [0, 26, -52] // the AI core, suspended above the landscape
export const MATCH_POS = [0, 8, -268] // the match amphitheatre
export const CITY_POS = [0, -10, -302] // the "build" city rising at the end

/* The five explorable zones — one floating island each.
   Positions weave left/right as the camera travels deeper (-z). */
export const ZONES = [
  {
    id: 'founder',
    name: 'Founder Valley',
    kicker: 'Zone 01',
    color: '#ff2740',
    pos: [-30, -4, -95],
    blurb:
      'Where startup founders meet the co-founder who completes the cap table — matched on stage, commitment and complementary craft.',
    stat: '1,240+ founder matches',
  },
  {
    id: 'hackathon',
    name: 'Hackathon Nexus',
    kicker: 'Zone 02',
    color: '#22d3ee',
    pos: [30, 8, -130],
    blurb:
      'Squads assemble in real time. See who is hunting the same hackathon and lock your team before registration even closes.',
    stat: '640+ teams shipped',
  },
  {
    id: 'creator',
    name: 'Creator District',
    kicker: 'Zone 03',
    color: '#a78bfa',
    pos: [-28, 14, -168],
    blurb:
      'Designers, writers, filmmakers and photographers collide here — portfolios orbit each other until the right ones lock.',
    stat: '2,100+ creative collabs',
  },
  {
    id: 'music',
    name: 'Music Realm',
    kicker: 'Zone 04',
    color: '#f59e0b',
    pos: [26, -2, -205],
    blurb:
      'Musicians discover bandmates, producers and late-night jam partners — matched by genre, instrument and ambition.',
    stat: '480+ bands formed',
  },
  {
    id: 'community',
    name: 'Community Forest',
    kicker: 'Zone 05',
    color: '#34d399',
    pos: [-18, 9, -240], // kept clear of the match-amphitheatre flight corridor

    blurb:
      'Interest-based communities grow like living ecosystems — every new member another branch, every project a new bloom.',
    stat: '300+ living circles',
  },
]

/* deterministic rng so the universe looks the same on every visit */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/* soft radial glow — shared texture for every additive sprite/point */
let _glow = null
export function glowTexture() {
  if (_glow) return _glow
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.22, 'rgba(255,255,255,0.6)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.14)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  _glow = new THREE.CanvasTexture(c)
  return _glow
}

/* GLSL: seamless 3D value noise + fbm, shared by the nebula & the core */
export const NOISE_GLSL = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i);
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(7.7);
      a *= 0.5;
    }
    return v;
  }
`
