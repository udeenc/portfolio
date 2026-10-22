import { useEffect, useRef, useState } from 'react'
import { greetings, mountTypewriter } from '../effects/typewriter.js'

export default function HeroGreeting() {
  const writerRef = useRef(null)
  const [view, setView] = useState({ text: greetings[0], typing: false, changing: false })

  useEffect(() => mountTypewriter(writerRef.current.closest('.hero'), setView), [])

  return (
    <span ref={writerRef} className={`hero-typewriter${view.typing ? ' is-typing' : ''}`} aria-hidden="true">
      <span className="hero-greeting-size">There's a story behind every project.</span>
      <span className={`hero-greeting-text${view.changing ? ' is-changing' : ''}`}>{view.text}</span>
    </span>
  )
}
