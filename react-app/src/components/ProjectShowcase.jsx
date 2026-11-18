import PipelineGallery from './PipelineGallery.jsx'
import ProjectMedia from './ProjectMedia.jsx'

function ProjectTags({ technologies }) {
  return <ul className="work-showcase__tags" aria-label="Project technologies">
    {technologies.map(technology => <li key={technology}>{technology}</li>)}
  </ul>
}

export default function ProjectShowcase({ project }) {
  return (
    <article className={`work-showcase work-showcase--${project.id}`} aria-labelledby={project.titleId} data-work-reveal="">
      <header className="work-showcase__heading">
        <h3 id={project.titleId}>{project.title}</h3>
      </header>
      <div className="work-showcase__visual">
        {project.visual === 'pipeline' ? <PipelineGallery images={project.media} /> : <ProjectMedia images={project.media} />}
      </div>
      <div className="work-showcase__summary">
        <div className="work-showcase__description">
          {project.context && <p className="work-showcase__context">{project.context}</p>}
          <p>{project.description}</p>
        </div>
        <div className="work-showcase__meta">
          <ProjectTags technologies={project.technologies} />
          {(project.details || project.repository) && <div className="work-showcase__actions">
            {project.details && <a className="work-showcase__link" href="#project-details">View Project <span aria-hidden="true">↓</span></a>}
            {project.repository && <a className="work-showcase__link" href={project.repository} target="_blank" rel="noopener noreferrer">
              GitHub Repository <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
            </a>}
          </div>}
        </div>
      </div>
      {project.metrics && <div className="work-showcase__dataset">
        <dl className="work-showcase__metrics" aria-label="Key dataset metrics">
          {project.metrics.map(metric => <div key={metric.label}>
            <dt>{metric.label}{metric.suffix && <> <span>{metric.suffix}</span></>}</dt>
            <dd>{metric.approximate && <span className="sr-only">Approximately </span>}{metric.value}</dd>
          </div>)}
        </dl>
        <p className="work-showcase__metrics-note">{project.metricsNote}</p>
      </div>}
      {project.details && <div className="work-showcase__details" id="project-details" aria-labelledby="project-details-title">
        <p className="work-showcase__context">{project.details.eyebrow}</p>
        <h4 id="project-details-title">{project.details.title}</h4>
        <ol className="work-showcase__process">
          {project.details.steps.map(step => <li key={step.title}><h5>{step.title}</h5><p>{step.text}</p></li>)}
        </ol>
        <aside className="work-showcase__insight" aria-label="Analytical observation">
          <p className="work-showcase__context">Analytical observation</p><p>{project.details.insight}</p>
        </aside>
      </div>}
    </article>
  )
}
