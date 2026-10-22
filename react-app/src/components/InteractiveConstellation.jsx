import { useEffect, useRef } from 'react'
import StaticConstellation from './StaticConstellation.jsx'
import { mountConstellation } from '../effects/constellation.js'
import { createHeroProgress, mountHeroDissolve } from '../effects/heroDissolve.js'

export default function InteractiveConstellation() {
  const host = useRef(null)
  useEffect(() => {
    const progress = createHeroProgress()
    const stopScene = mountConstellation(host.current, { progress })
    const stopScroll = mountHeroDissolve(host.current.closest('section'), progress)
    return () => { stopScene(); stopScroll() }
  }, [])
  return (
    <div className="lab-constellation-layer" aria-hidden="true">
      <StaticConstellation />
      <div className="lab-constellation-webgl" ref={host} />
    </div>
  )
}
