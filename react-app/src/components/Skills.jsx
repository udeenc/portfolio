export default function Skills() {
  return (
    <section className="section section-stack container" id="skills" aria-labelledby="skills-title">
          <div><p className="eyebrow">04 / Skills</p><h2 id="skills-title">Tools behind the work.</h2><p className="section-description">Technologies I use across data, analytics, and software projects.</p></div>
          <div className="skills-grid">
            <article className="skill-card"><span className="skill-number" aria-hidden="true">01</span><h3>Analytics &amp; reporting</h3><ul className="tags"><li>Power BI</li><li>DAX</li></ul></article>
            <article className="skill-card"><span className="skill-number" aria-hidden="true">02</span><h3>Data preparation</h3><ul className="tags"><li>Power Query</li><li>Python</li></ul></article>
            <article className="skill-card"><span className="skill-number" aria-hidden="true">03</span><h3>Version control</h3><ul className="tags"><li>Git</li></ul></article>
          </div>
        </section>
  )
}
