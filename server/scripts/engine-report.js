import { db } from '../src/db.js'
import { rankFor } from '../src/engine/index.js'

/* Calibration report — score every (viewer, candidate) pair in the
   network and print the distribution + a sample deck per member.
   Run when tuning STEEPNESS / MIDPOINT:  node scripts/engine-report.js */

const users = await db.user.findMany({ include: { memberships: { include: { community: true } } } })
const all = []
const decks = new Map()

for (const viewer of users) {
  const items = await rankFor(viewer, { where: {}, limit: 99, poolSize: 400 })
  decks.set(viewer.name, items)
  for (const it of items) all.push(it.score)
}

all.sort((a, b) => a - b)
const q = (p) => all[Math.floor(p * (all.length - 1))]
console.log(`pairs scored : ${all.length}`)
console.log(`min/max      : ${all[0]} / ${all[all.length - 1]}`)
console.log(`p10/p25/p50  : ${q(0.1)} / ${q(0.25)} / ${q(0.5)}`)
console.log(`p75/p90      : ${q(0.75)} / ${q(0.9)}`)

const buckets = new Map()
for (const s of all) {
  const b = Math.floor(s / 10) * 10
  buckets.set(b, (buckets.get(b) || 0) + 1)
}
console.log('\nhistogram')
for (const [b, n] of [...buckets.entries()].sort((a, b2) => a[0] - b2[0]))
  console.log(`${String(b).padStart(3)}s ${'█'.repeat(Math.ceil((n / all.length) * 60))} ${n}`)

const sample = process.argv[2] || users[0].name
console.log(`\n--- deck for ${sample} ---`)
for (const it of decks.get(sample) || []) {
  console.log(String(it.score).padStart(2), '|', it.user.name.padEnd(22), '|', it.why.join(' · ').slice(0, 110))
}

await db.$disconnect()
