import { useEffect, useRef } from 'react'
import { mountAboutReveal } from '../effects/aboutReveal.js'

export default function About() {
  const aboutRef = useRef(null)
  useEffect(() => mountAboutReveal(aboutRef.current), [])

  return (
    <div className="about-overlap">
        <section ref={aboutRef} className="section container about" id="about" aria-labelledby="about-title">
          <p className="eyebrow about-label" data-about-reveal="">About</p>
          <div className="about-intro">
            <h2 id="about-title" data-about-reveal=""><span>Good data.</span> <span>Better decisions.</span></h2>
            <p className="about-description" data-about-reveal="">I'm a Computer Science undergraduate at BINUS University with a growing interest in Data Engineering and Data Analytics. I'm particularly interested in transforming raw data into reliable, well-structured datasets that can support meaningful analysis and better decision-making. Through hands-on projects, I enjoy exploring data pipelines, database systems, and analytical tools while continuously strengthening my technical and problem-solving skills. I'm always eager to learn new technologies and apply what I've learned to real-world data challenges.</p>
          </div>
          <dl className="about-academics" aria-label="Academic information">
            <div className="academic-card" data-about-reveal="">
              <dt className="small-label">UNIVERSITY</dt>
              <dd><span className="academic-value">BINUS University</span></dd>
            </div>
            <div className="academic-card" data-about-reveal="">
              <dt className="small-label">DEGREE</dt>
              <dd><span className="academic-value">B.Sc. in Computer Science</span><span className="academic-status">In Progress</span></dd>
            </div>
            <div className="academic-card" data-about-reveal="">
              <dt className="small-label">GPA</dt>
              <dd><span className="academic-value academic-numeric">3.66 / 4.00</span></dd>
            </div>
            <div className="academic-card" data-about-reveal="">
              <dt className="small-label">EXPECTED GRADUATION</dt>
              <dd><span className="academic-value academic-numeric">2028</span></dd>
            </div>
          </dl>
          <div className="about-strengths" aria-labelledby="about-strengths-title" data-about-reveal="">
            <h3 className="small-label" id="about-strengths-title">WHAT I BRING</h3>
            <ul>
              <li><span aria-hidden="true">↗</span>Ensure Data Quality</li>
              <li><span aria-hidden="true">↗</span>Build Reliable Data Pipelines</li>
              <li><span aria-hidden="true">↗</span>Analyze Problems Systematically</li>
              <li><span aria-hidden="true">↗</span>Solve Problems Collaboratively</li>
              <li><span aria-hidden="true">↗</span>Exchange Ideas and Feedback</li>
              <li><span aria-hidden="true">↗</span>Align Data with Business Needs</li>
            </ul>
          </div>
        </section>
        </div>
  )
}
