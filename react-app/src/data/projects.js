import executiveOverview from '../assets/images/executive-overview.png'
import salesAnalysis from '../assets/images/sales-analysis.png'
import customerExperience from '../assets/images/customer-experience.png'
import architecture from '../assets/images/architecture.png'
import airflowWorkflow from '../assets/images/airflow-workflow.png'
import starSchema from '../assets/images/star-schema.png'

// Verification and source boundaries are documented in SELECTED-WORK-W1.md.
// No public pipeline repository URL has been established; do not infer one.
export const projects = [
  {
    id: 'pipeline',
    title: 'Automated Data Pipeline', titleId: 'pipeline-title',
    description: 'Cleaning CSV data with Python and loading it into MySQL, with Apache Airflow orchestration in a Docker environment.',
    technologies: ['Python', 'Apache Airflow', 'Docker', 'MySQL'],
    visual: 'pipeline',
    media: [
      { src: architecture, label: 'Architecture Diagram',
        alt: 'Automated Data Pipeline architecture: CSV ingestion and transformation with Python, MySQL raw and final storage, orchestrated by Airflow in Docker.',
        width: 1600, height: 760 },
      { src: airflowWorkflow, label: 'Airflow DAG',
        alt: 'Airflow DAG showing ingest_csv_to_raw followed by transform_raw_to_star_schema, both marked successful.',
        width: 512, height: 140 },
      { src: starSchema, label: 'Star Schema',
        alt: 'Star schema with fact_sales connected to customer, date, product and location dimension tables.',
        width: 828, height: 639 },
    ],
    orchestration: { name: 'Apache Airflow', role: 'Orchestration' },
    environment: 'Docker environment',
    stages: [
      { name: 'CSV', role: 'Source', note: 'Raw data' },
      { name: 'Python', role: 'Transform', note: 'Clean & prepare' },
      { name: 'MySQL', role: 'Destination', note: 'Structured data' },
    ],
  },
  {
    id: 'olist',
    title: 'Olist E-Commerce Analytics', titleId: 'project-title',
    context: 'Olist dataset / End-to-end analytics',
    description: 'From Python data profiling to a star-schema model in Power BI: exploring sales, delivery performance, and customer experience across the Brazilian Olist e-commerce dataset.',
    technologies: ['Power BI', 'Power Query', 'DAX', 'Python', 'Git'],
    visual: 'dashboards',
    repository: 'https://github.com/udeenc/ecommerce-powerbi-analysis',
    metrics: [
      { label: 'Sales', value: 'R$13.59M', approximate: true },
      { label: 'Orders', value: '98.7K', approximate: true },
      { label: 'Avg Review', suffix: '/ 5', value: '4.09' },
      { label: 'On-Time', value: '91.89%' },
    ],
    metricsNote: 'Dataset overview · Sales and orders are rounded.',
    media: [
      { src: executiveOverview, label: 'Executive overview', name: 'executive overview',
        alt: 'Executive overview dashboard for Brazilian E-Commerce Analytics', width: 1278, height: 720 },
      { src: salesAnalysis, label: 'Sales analysis', name: 'sales analysis',
        alt: 'Sales analysis dashboard for Brazilian E-Commerce Analytics', width: 1278, height: 718 },
      { src: customerExperience, label: 'Customer experience', name: 'customer experience',
        alt: 'Customer experience dashboard for Brazilian E-Commerce Analytics', width: 1277, height: 718 },
    ],
    details: {
      eyebrow: 'Behind the dashboards', title: 'From raw data to a clear view.',
      steps: [
        { title: 'Profile', text: 'Profiled the data with Python before analytical modeling.' },
        { title: 'Model & explore', text: 'Built a star-schema model in Power BI, with Executive Overview, Sales Analysis, and Customer Experience dashboards.' },
        { title: 'Version', text: 'Used PBIP/TMDL to keep the Power BI project under source control with Git.' },
      ],
      insight: 'On-time deliveries are associated with higher average review scores than late deliveries. This relationship does not establish causation.',
    },
  },
]
