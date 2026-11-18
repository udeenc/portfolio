export default function PipelineVisual({ project }) {
  return (
    <figure className="work-pipeline" aria-label="Conceptual CSV to MySQL processing stages">
      <div className="work-pipeline__environment">
        <div className="work-pipeline__orchestration">
          <span className="work-pipeline__glyph" aria-hidden="true">⌘</span>
          <span><strong>{project.orchestration.name}</strong><span>{project.orchestration.role}</span></span>
        </div>
        <ol className="work-pipeline__stages" aria-label="Processing order">
          {project.stages.map((stage, index) => (
            <li className="work-pipeline__stage" key={stage.name}>
              <span className="work-pipeline__port" aria-hidden="true">0{index + 1}</span>
              <span className="work-pipeline__role">{stage.role}</span>
              <strong>{stage.name}</strong>
              <span className="work-pipeline__note">{stage.note}</span>
            </li>
          ))}
        </ol>
        <div className="work-pipeline__boundary"><span aria-hidden="true">▧</span> {project.environment}</div>
      </div>
      <figcaption>Conceptual architecture · Processing stages, not live system activity</figcaption>
    </figure>
  )
}
