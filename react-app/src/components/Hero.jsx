import { useEffect, useRef } from 'react'
import HeroOrb from './HeroOrb.jsx'
import HeroGreeting from './HeroGreeting.jsx'
import { mountHeroFade } from '../effects/heroFade.js'

export default function Hero() {
  const heroRef = useRef(null)
  useEffect(() => mountHeroFade(heroRef.current), [])

  return (
    <section ref={heroRef} className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-layout container">
          <div className="hero-stage">
          <div className="hero-content">
            <p className="eyebrow hero-eyebrow hero-reveal">Computer Science undergraduate, based in Alam Sutera.</p>
            <h1 id="hero-title"><span className="hero-name-line">Hello,</span> <span className="hero-name-line hero-name-accent">I'm Candra</span></h1>
            <p className="hero-greeting hero-reveal">
              <span className="sr-only">Curious about what I build? There's a story behind every project. Scroll down and take a look.</span>
              <HeroGreeting />
            </p>
            <p className="hero-description hero-reveal">A collection of things I've built, explored, and learned along the way.</p>
            <p className="small-label hero-curiosity hero-reveal">CURIOSITY. STRUCTURE. INSIGHT.</p>
          </div>
          <HeroOrb />
          </div>
          <div className="hero-bottom"><a className="hero-scroll hero-reveal" href="#about"><span className="hero-scroll-track" aria-hidden="true"></span><span>Scroll to Explore</span><span aria-hidden="true">↓</span></a></div>
          </div>
        </section>
  )
}
