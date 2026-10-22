import { useId } from 'react'
import { constellationEdges, constellationNodes } from '../data/constellation.js'

// Always-present static layer: no canvas, motion, timers, or WebGL dependency.
export default function StaticConstellation() {
  const id = useId()
  const linkGradient = `${id}-links`
  const haloGradient = `${id}-halo`

  return (
    <svg
      className="lab-constellation"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={linkGradient} x1="650" y1="300" x2="1500" y2="650" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--v2-accent)" stopOpacity="0.2" />
          <stop offset="0.55" stopColor="var(--v2-accent)" stopOpacity="0.65" />
          <stop offset="1" stopColor="var(--v2-accent-secondary)" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`${haloGradient}-cyan`}>
          <stop stopColor="var(--v2-accent)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--v2-accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${haloGradient}-violet`}>
          <stop stopColor="var(--v2-accent-secondary)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--v2-accent-secondary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" stroke={`url(#${linkGradient})`} strokeWidth="0.8">
        {constellationEdges.map(([from, to]) => {
          const [x1, y1] = constellationNodes[from]
          const [x2, y2] = constellationNodes[to]
          return <path key={`${from}-${to}`} d={`M${x1} ${y1}L${x2} ${y2}`} />
        })}
      </g>
      {constellationNodes.map(([x, y, radius], index) => (
        <g
          key={index}
          className={index % 4 === 0 ? 'lab-constellation__violet' : 'lab-constellation__cyan'}
          opacity={radius < 2 ? 0.4 : 0.9}
        >
          {radius >= 3 && <circle cx={x} cy={y} r={radius * 9} fill={`url(#${haloGradient}-${index % 4 === 0 ? 'violet' : 'cyan'})`} />}
          <circle cx={x} cy={y} r={radius} fill="currentColor" />
          {radius >= 4 && <circle cx={x} cy={y} r={radius + 6} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />}
        </g>
      ))}
    </svg>
  )
}
