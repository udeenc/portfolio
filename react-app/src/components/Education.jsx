export default function Education() {
  return (
    <aside className="about-v2__education" id="education" aria-labelledby="education-title">
      <p className="about-v2__metadata">Education</p>
      <h3 id="education-title">BINUS University</h3>
      <p className="about-v2__degree">B.Sc. in Computer Science</p>
      <p className="about-v2__status">Bachelor's degree in progress</p>
      <dl className="about-v2__academic-details" aria-label="Academic information">
        <div><dt>Expected graduation</dt><dd>2028</dd></div>
        <div><dt>GPA</dt><dd>3.66 <span>/ 4.00</span></dd></div>
      </dl>
    </aside>
  )
}
