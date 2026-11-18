import { projects } from '../data/projects.js'
import ProjectShowcase from './ProjectShowcase.jsx'
import { useEffect, useRef } from 'react'
import { mountWorkReveal } from '../effects/workReveal.js'
import Projects from './Projects.jsx'

export default function SelectedWork() {
  const section = useRef(null)
  useEffect(() => mountWorkReveal(section.current), [])
  return (
    <section ref={section} className="selected-work" id="featured" aria-labelledby="featured-title">
      <div className="selected-work__inner container">
        <header className="selected-work__intro">
          <p className="selected-work__eyebrow homepage-label" data-work-reveal="">02 / SELECTED WORK</p>
          <h2 id="featured-title" data-work-reveal="">Built with purpose.</h2>
          <p className="selected-work__description" data-work-reveal="">A selection of projects exploring data pipelines, analytical systems, and meaningful insights.</p>
        </header>
        <div className="selected-work__projects">
          {projects.map(project => <ProjectShowcase key={project.id} project={project} />)}
        </div>
        <Projects />
      </div>
    </section>
  )
}
