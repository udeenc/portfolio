import { constellationNodes } from './constellation.js'

export const constellationConfig = Object.freeze({ count: 150, dpr: 1.5, fps: 30, flows: 6 })

// Outward from the dense cluster with deterministic depth and distance per ID.
// Generated once, without consuming or changing H2's seeded node sequence.
export function createDissolveOffsets(nodes) {
  return nodes.map(({ position: [x, y, z] }, id) => {
    const hash = (Math.imul(id + 1, 2654435761) >>> 0) / 4294967296
    const angle = hash * Math.PI * 2
    const dx = (x - 3) * .25 + Math.cos(angle) * .35
    const dy = y * .3 + Math.sin(angle) * .35
    const dz = z * .25 + (hash - .5) * .5
    const scale = (.7 + hash * 1.5) / Math.max(.1, Math.hypot(dx, dy, dz))
    return [dx * scale, dy * scale, dz * scale]
  })
}

// Anchor the depth cloud to H1's composition, with extra density near its centre.
export function createConstellationData(seed = 2026) {
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const nodes = Array.from({ length: constellationConfig.count }, (_, i) => {
    const anchor = constellationNodes[i < constellationNodes.length ? i : 7 + Math.floor(random() * 21)]
    const x = Math.max(650, Math.min(1575, anchor[0] + (i < constellationNodes.length ? 0 : (random() - .5) * 220)))
    const y = Math.max(120, Math.min(840, anchor[1] + (i < constellationNodes.length ? 0 : (random() - .5) * 200)))
    return { position: [(x - 800) / 100, (500 - y) / 100, (random() - .5) * 2.6],
      size: 2 + random() * 3, phase: random() * Math.PI * 2, violet: i % 4 === 0 }
  })
  const edges = []
  const degree = new Uint8Array(nodes.length)
  const candidates = []
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const distance = Math.hypot(...nodes[a].position.map((v, axis) => v - nodes[b].position[axis]))
      if (distance < 1.9) candidates.push({ a, b, distance })
    }
  }
  candidates.sort((a, b) => a.distance - b.distance)
  for (const { a, b } of candidates) {
    if (degree[a] < 3 && degree[b] < 3) { edges.push([a, b]); degree[a]++; degree[b]++ }
  }
  return { nodes, edges }
}
