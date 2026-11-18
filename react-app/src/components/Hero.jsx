import InteractiveConstellation from './InteractiveConstellation.jsx'

export default function Hero() {
  return (
    <section className="lab-hero" id="home" aria-labelledby="hero-title">
      <div className="lab-hero__atmosphere" aria-hidden="true" />
      <InteractiveConstellation />
      <div className="lab-hero__inner container">
        <div className="lab-hero__content">
          <p className="lab-hero__eyebrow">COMPUTER SCIENCE · DATA ENGINEERING &amp; ANALYTICS</p>
          <h1 className="lab-hero__headline" id="hero-title">
            <span>Hello, I'm Candra.</span>
            <span className="lab-hero__headline-accent">I build with data.</span>
          </h1>
          <p className="lab-hero__description">
            Exploring data engineering and analytics through reliable pipelines, thoughtful analysis, and practical projects.
          </p>
          <div className="lab-hero__actions">
            <a className="lab-hero__cta lab-hero__cta--primary" href="#featured">
              Explore Work <span aria-hidden="true">↗</span>
            </a>
            <a className="lab-hero__cta lab-hero__cta--secondary" href="#about">
              About Me <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <a className="lab-hero__scroll" href="#about">
          <span className="lab-hero__scroll-line" aria-hidden="true" />
          <span>Scroll to Explore</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  )
}
