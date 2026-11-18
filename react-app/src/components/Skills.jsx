const capabilities = [
  {
    title: 'Data Engineering',
    skills: ['CSV extraction and loading', 'Python data cleaning and transformation', 'Pipeline orchestration in containerized environments'],
    technologies: ['Apache Airflow', 'Docker'],
  },
  {
    title: 'Data Analytics',
    skills: ['Dataset profiling', 'Sales, delivery, and customer experience analysis', 'Analytical reporting and dashboards'],
    technologies: ['Power BI', 'Power Query', 'DAX'],
  },
  {
    title: 'Databases & Data Modeling',
    skills: ['Relational data structures', 'Fact and dimension tables', 'Data modeling for analysis'],
    technologies: ['MySQL', 'Dimensional modeling', 'Star schema'],
  },
  {
    title: 'Programming & Development',
    skills: ['Data preparation scripts', 'Component-based web interfaces', 'Project version control'],
    technologies: ['Python', 'JavaScript', 'React', 'Git', 'GitHub'],
  },
]

export default function Skills() {
  return (
    <section className="skills-v2" id="skills" aria-labelledby="skills-title">
      <div className="skills-v2__inner container">
        <h2 className="homepage-label skills-v2__label" id="skills-title">03 / SKILLS &amp; CAPABILITIES</h2>
        <div className="skills-v2__grid">
          {capabilities.map(({ title, skills, technologies }) => (
            <article className="skills-v2__capability" key={title}>
              <h3>{title}</h3>
              <ul className="skills-v2__skills" aria-label={`${title} capabilities`}>{skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
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
