const capabilities = [
  {
    title: 'Data Engineering',
    description: 'Extract, clean, and load CSV data into MySQL, with Python transformations orchestrated by Airflow in a Docker environment.',
    technologies: ['Apache Airflow', 'Docker'],
  },
  {
    title: 'Data Analytics',
    description: 'Profile datasets and turn sales, delivery, and customer experience questions into analytical reports and dashboards.',
    technologies: ['Power BI', 'Power Query', 'DAX'],
  },
  {
    title: 'Databases & Data Modeling',
    description: 'Structure data in relational tables and build star-schema models with fact and dimension tables for analysis.',
    technologies: ['MySQL', 'Dimensional modeling', 'Star schema'],
  },
  {
    title: 'Programming & Development',
    description: 'Write data preparation scripts and build component-based web interfaces, keeping project changes under version control.',
    technologies: ['Python', 'JavaScript', 'React', 'Git', 'GitHub'],
  },
]

export default function Skills() {
  return (
    <section className="skills-v2" id="skills" aria-labelledby="skills-title">
      <div className="skills-v2__inner container">
        <div className="skills-v2__intro">
          <p className="homepage-label skills-v2__eyebrow">03 / SKILLS &amp; CAPABILITIES</p>
          <h2 id="skills-title">Tools are part of the process.</h2>
          <p className="skills-v2__description">The focus is on what I can build, analyze, and improve with them.</p>
        </div>
        <div className="skills-v2__grid">
          {capabilities.map(({ title, description, technologies }) => (
            <article className="skills-v2__capability" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
              <ul className="skills-v2__technologies" aria-label={`${title} tools and methods`}>
                {technologies.map(technology => <li key={technology}>{technology}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
