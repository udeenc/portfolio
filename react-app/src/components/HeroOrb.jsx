import { useEffect, useRef } from 'react'
import { initHeroOrb } from '../effects/orbRenderer.js'

export default function HeroOrb() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const renderer = initHeroOrb(containerRef.current, canvasRef.current)
    return () => renderer?.destroy()
  }, [])

  return (
    <div ref={containerRef} className="hero-orb" data-hero-orb="" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-orb-canvas" aria-hidden="true" />
    </div>
  )
}
