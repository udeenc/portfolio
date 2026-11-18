export default function Projects() {
  return (
    <aside className="selected-work__more" id="projects" aria-labelledby="projects-title">
      <div>
        <p className="work-showcase__context">On GitHub</p>
        <h3 id="projects-title">More work, beyond the dashboard.</h3>
        <p className="selected-work__more-label">Additional projects</p>
        <p>Explore my GitHub for additional projects in software, data, and computing.</p>
      </div>
      <a className="work-showcase__link" href="https://github.com/udeenc" target="_blank" rel="noopener noreferrer">Explore my GitHub <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
    </aside>
  )
}
