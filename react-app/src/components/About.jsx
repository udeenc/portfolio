import Education from './Education.jsx'

export default function About() {
  return (
    <section className="about-v2" id="about" aria-labelledby="about-title">
      <div className="about-v2__inner container">
        <div className="about-v2__introduction">
          <p className="homepage-label about-v2__eyebrow">01 / ABOUT ME</p>
          <h2 id="about-title"><span>Curious by nature.</span><span>Driven by data.</span></h2>
          <p className="about-v2__lead">I'm a Computer Science student exploring how data systems are built, maintained, and transformed into meaningful insights.</p>
          <p className="about-v2__description">Personal and university projects give me a practical way to explore Data Engineering and Data Analytics, from preparing datasets to connecting analysis with real questions.</p>
        </div>
        <Education />
        <div className="about-v2__strengths" aria-labelledby="about-strengths-title">
          <h3 id="about-strengths-title">What I bring</h3>
          <ul>
            <li>Ensure Data Quality</li>
            <li>Build Reliable Data Pipelines</li>
            <li>Analyze Problems Systematically</li>
            <li>Solve Problems Collaboratively</li>
            <li>Exchange Ideas and Feedback</li>
            <li>Align Data with Business Needs</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
