import executiveOverview from '../assets/images/executive-overview.png'
import salesAnalysis from '../assets/images/sales-analysis.png'
import customerExperience from '../assets/images/customer-experience.png'

export default function FeaturedProjects() {
  return (
    <section className="section section-stack container" id="featured" aria-labelledby="featured-title">
          <div className="section-top"><div><p className="eyebrow">02 / Featured project</p><h2 id="featured-title">A closer look at the data.</h2></div><span className="small-label">Analytics / Visualization</span></div>
          <article className="featured-card" aria-labelledby="project-title">
            <div className="project-intro">
              <div>
                <p className="eyebrow">Olist dataset / End-to-end analytics</p>
                <h3 id="project-title">Brazilian E-Commerce Analytics</h3>
                <p>From Python data profiling to a star-schema model in Power BI: exploring sales, delivery performance, and customer experience across the Brazilian Olist e-commerce dataset.</p>
                <ul className="tags" aria-label="Project technologies">
                  <li>Power BI</li><li>Power Query</li><li>DAX</li><li>Python</li><li>Git</li>
                </ul>
                <div className="actions">
                  <a className="button button-primary" href="#project-details">View Project <span aria-hidden="true">↓</span></a>
                  <a className="button button-secondary" href="https://github.com/udeenc/ecommerce-powerbi-analysis" target="_blank" rel="noopener noreferrer">GitHub Repository <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
                </div>
              </div>
            </div>
            <dl className="project-metrics" aria-label="Key dataset metrics">
              <div><dt>Sales</dt><dd><span className="sr-only">Approximately </span>R$13.59M</dd></div>
              <div><dt>Orders</dt><dd><span className="sr-only">Approximately </span>98.7K</dd></div>
              <div><dt>Avg Review <span>/ 5</span></dt><dd>4.09</dd></div>
              <div><dt>On-Time</dt><dd>91.89%</dd></div>
            </dl>
            <p className="metrics-note">Dataset overview · Sales and orders are rounded.</p>
            <div className="dashboard-gallery">
              <figure className="dashboard dashboard-main"><a href={executiveOverview} target="_blank" rel="noopener noreferrer" aria-label="View full executive overview dashboard (opens in a new tab)"><img src={executiveOverview} alt="Executive overview dashboard for Brazilian E-Commerce Analytics" loading="lazy" decoding="async" /></a><figcaption><span>01 / Executive overview</span><span aria-hidden="true">↗</span></figcaption></figure>
              <figure className="dashboard"><a href={salesAnalysis} target="_blank" rel="noopener noreferrer" aria-label="View full sales analysis dashboard (opens in a new tab)"><img src={salesAnalysis} alt="Sales analysis dashboard for Brazilian E-Commerce Analytics" loading="lazy" decoding="async" /></a><figcaption><span>02 / Sales analysis</span><span aria-hidden="true">↗</span></figcaption></figure>
              <figure className="dashboard"><a href={customerExperience} target="_blank" rel="noopener noreferrer" aria-label="View full customer experience dashboard (opens in a new tab)"><img src={customerExperience} alt="Customer experience dashboard for Brazilian E-Commerce Analytics" loading="lazy" decoding="async" /></a><figcaption><span>03 / Customer experience</span><span aria-hidden="true">↗</span></figcaption></figure>
            </div>
            <div className="project-details" id="project-details" aria-labelledby="project-details-title">
              <div className="project-details-heading">
                <p className="eyebrow">Behind the dashboards</p>
                <h4 id="project-details-title">From raw data to a clear view.</h4>
              </div>
              <ol className="project-process">
                <li><h5>Profile</h5><p>Profiled the data with Python before analytical modeling.</p></li>
                <li><h5>Model &amp; explore</h5><p>Built a star-schema model in Power BI, with Executive Overview, Sales Analysis, and Customer Experience dashboards.</p></li>
                <li><h5>Version</h5><p>Used PBIP/TMDL to keep the Power BI project under source control with Git.</p></li>
              </ol>
              <aside className="project-insight" aria-label="Analytical observation">
                <p className="eyebrow">Analytical observation</p>
                <p>On-time deliveries are associated with higher average review scores than late deliveries. This relationship does not establish causation.</p>
              </aside>
            </div>
          </article>
        </section>
  )
}
