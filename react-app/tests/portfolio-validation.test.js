import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import config from '../vite.config.js'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const decode = text => text
  .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)))
  .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(+value))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

// Tokenize this repository's static markup to compare structure, attributes,
// and copy while ignoring indentation, HTML comments, and attribute order.
function tokens(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').match(/<[^>]+>|[^<]+/g).flatMap(token => {
    if (!token.startsWith('<')) {
      const text = decode(token).replace(/\s+/g, ' ').trim()
      return text ? [['text', text]] : []
    }
    if (token.startsWith('</')) return [['end', token.match(/^<\/(\w+)/)[1]]]
    const tag = token.match(/^<(\w+)/)[1]
    const attrs = {}
    for (const match of token.slice(tag.length + 1).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
      attrs[match[1]] = decode(match[2] || '')
    }
    // Original HTML is unenhanced; React's working menu starts collapsed.
    if (attrs.class === 'nav-toggle') delete attrs.hidden
    if (attrs.id === 'nav-links') attrs.class = attrs.class.replace(' is-collapsed', '')
    for (const key of ['src', 'href']) {
      if (attrs[key]?.includes('/images/')) attrs[key] = 'assets/images/' + attrs[key].split('/').pop()
    }
    return [['start', tag, Object.fromEntries(Object.entries(attrs).sort())]]
  })
}

test('A1 integrates About/Education, orders and numbers sections, and preserves Hero/gallery contracts', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const markup = renderToStaticMarkup(createElement(App))
    const original = read('../../index.html').match(/<body>([\s\S]*?)<\/body>/)[1]
      // The original script also updates this year after loading.
      .replace(/(<span id="year">)\d{4}/, '$1' + new Date().getFullYear())
    // A1 integrates About/Education; S1 and C1 replace Skills and Contact.
    // N1 refines Header; retain brand identity and the approved section contracts.
    const heroPattern = /<section\b[^>]*\bid="home"[^>]*>[\s\S]*?<\/section>/
    const workPattern = /<section\b[^>]*\bid="featured"[^>]*>[\s\S]*?<\/section>/
    const hero = markup.match(heroPattern)[0]
    const section = (html, id) => html.match(new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>[\\s\\S]*?<\\/section>'))[0]
    const header = markup.match(/<header\b[^>]*>[\s\S]*?<\/header>/)[0]
    const headerElements = tokens(header).filter(token => token[0] === 'start')
    assert.deepEqual(headerElements.filter(token => token[1] === 'a').map(token => token[2].href),
      ['#home', '#about', '#featured', '#skills', '#contact'])
    assert(header.includes('CANDRA WIJAYA'))
    assert.match(header, /aria-label="Candra Wijaya home">cw<span>\.<\/span>/)
    assert.match(header, /<nav[^>]*aria-label="Main navigation"/)
    const toggle = headerElements.find(token => token[1] === 'button')[2]
    assert.equal(toggle.type, 'button')
    assert.equal(toggle['aria-expanded'], 'false')
    assert.equal(toggle['aria-controls'], 'nav-links')
    assert.equal(toggle['aria-label'], 'Open navigation menu')
    assert.match(header, /class="nav-links is-collapsed"/)
    assert(!header.includes('aria-current')) // No active section in the initial Hero.
    const skills = section(markup, 'skills')
    const skillElements = tokens(skills).filter(token => token[0] === 'start')
    const skillText = tokens(skills).filter(token => token[0] === 'text').map(token => token[1])
    assert.deepEqual(skillText.filter(text => /^0\d\s*\//.test(text)), ['03 / SKILLS & CAPABILITIES'])
    assert(!skills.includes('skills-v2__intro'))
    assert.match(skills, /<h2 class="homepage-label skills-v2__label" id="skills-title">03 \/ SKILLS &amp; CAPABILITIES<\/h2>/)
    assert(!/Tools are part|The focus is on/.test(skills))
    assert.equal((skills.match(/class="skills-v2__skills"/g) || []).length, 4)
    assert.deepEqual([...skills.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => decode(match[1])),
      ['Data Engineering', 'Data Analytics', 'Databases & Data Modeling', 'Programming & Development'])
    assert.equal(skillElements.filter(token => token[1] === 'article').length, 4)
    assert.equal(skillElements.filter(token => token[1] === 'h2').length, 1)
    assert.equal(skillElements.find(token => token[1] === 'h2')[2].id, 'skills-title')
    const technologyLabels = [...skills.matchAll(/<li>([^<]+)<\/li>/g)].map(match => decode(match[1]))
    assert.equal(new Set(technologyLabels).size, technologyLabels.length)
    for (const label of ['Power BI', 'DAX', 'Power Query', 'Python', 'Git', 'Apache Airflow', 'Docker',
      'MySQL', 'Dimensional modeling', 'Star schema', 'JavaScript', 'React', 'GitHub']) assert(technologyLabels.includes(label), label)
    for (const list of skillElements.filter(token => token[1] === 'ul')) assert(list[2]['aria-label'])
    assert(!skillElements.some(token => ['a', 'button', 'canvas', 'progress'].includes(token[1]) || 'tabindex' in token[2]))
    assert(!/\d+%|expert|mastery|Tableau|AWS|Azure|Google Cloud/i.test(skills))
    const skillsCSS = read('../src/styles/skills-v2.css')
    assert.match(skillsCSS, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
    assert.match(skillsCSS, /@media \(max-width: 800px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
    assert.match(skillsCSS, /flex-wrap: wrap/)
    assert.match(skillsCSS, /overflow-wrap: anywhere/)
    assert(!/animation:|transition:|cursor:|:hover/.test(skillsCSS))
    assert.match(read('../src/main.jsx'), /import '\.\/styles\/skills-v2\.css'/)
    const about = section(markup, 'about')
    const aboutHeadline = about.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]
    assert.deepEqual(tokens(aboutHeadline).filter(token => token[0] === 'text').map(token => token[1]),
      ['Curious by nature.', 'Driven by data.'])
    assert.match(decode(about), /I'm a Computer Science student exploring how data systems are built, maintained, and transformed into meaningful insights\./)
    const education = about.match(/<aside\b[^>]*\bid="education"[^>]*>[\s\S]*?<\/aside>/)[0]
    for (const fact of ['BINUS University', 'B.Sc. in Computer Science', "Bachelor's degree in progress", '2028', '3.66', '/ 4.00']) assert(decode(education).includes(fact), fact)
    assert.equal((markup.match(/BINUS University/g) || []).length, 1)
    assert(!/<section\b[^>]*id="education"/.test(markup))
    assert(!markup.includes('class="about-overlap"'))
    assert.match(markup, /<\/section><section class="about-v2" id="about"/)
    for (const strength of ['Ensure Data Quality', 'Build Reliable Data Pipelines', 'Analyze Problems Systematically',
      'Solve Problems Collaboratively', 'Exchange Ideas and Feedback', 'Align Data with Business Needs']) assert(about.includes(strength), strength)
    const work = markup.match(workPattern)[0]
    const workTokens = tokens(work)
    const workElements = workTokens.filter(token => token[0] === 'start')
    const workText = workTokens.filter(token => token[0] === 'text').map(token => token[1])
    assert.equal(workElements.filter(token => token[1] === 'article').length, 2)
    assert.deepEqual([...work.matchAll(/<article\b[^>]*>[\s\S]*?<h3\b[^>]*>([^<]*)<\/h3>/g)].map(match => match[1]),
      ['Automated Data Pipeline', 'Olist E-Commerce Analytics'])
    for (const copy of ['02 / SELECTED WORK', 'Built with purpose.',
      'A selection of projects exploring data pipelines, analytical systems, and meaningful insights.']) assert(workText.includes(copy), copy)
    assert(!work.includes('work-showcase__identity'))
    assert(!workText.some(text => /^0\d(?:\s*\/|$)/.test(text) && text !== '02 / SELECTED WORK'))
    assert(!workText.some(text => /^(?:Data Engineering|Data Analytics)$/i.test(text)))
    assert(!/On GitHub|Behind the dashboards|project-details|id="projects"|selected-work__more/.test(work))
    // Preserve Olist summary, metrics and captions; feedback explicitly removes
    // the old detail block and its View Project anchor.
    const replaced = ['02 / Featured project', 'A closer look at the data.',
      'Analytics / Visualization', 'Brazilian E-Commerce Analytics', 'View Project', '↓']
    const originalWorkSummary = original.match(workPattern)[0].split('<div class="project-details"')[0]
    for (const token of tokens(originalWorkSummary).filter(token => token[0] === 'text')) {
      const text = token[1].replace(/^0[123] \/ (?=Executive overview|Sales analysis|Customer experience)/, '')
      if (!replaced.includes(text)) assert(workText.includes(text), text)
    }
    assert(workElements.some(token => token[2].href === 'https://github.com/udeenc/ecommerce-powerbi-analysis'))
    assert(!workElements.some(token => token[2].href === '#'))
    const pipeline = work.match(/<article\b[^>]*pipeline[^>]*>[\s\S]*?<\/article>/)[0]
    const pipelineElements = tokens(pipeline).filter(token => token[0] === 'start')
    const switches = pipelineElements.filter(token => token[1] === 'button')
    assert.deepEqual([...pipeline.matchAll(/<button\b[^>]*>([^<]+)<\/button>/g)].map(match => match[1]),
      ['Architecture Diagram', 'Airflow DAG', 'Star Schema'])
    assert.deepEqual(switches.map(token => token[2]['aria-pressed']), ['true', 'false', 'false'])
    assert(switches.every(token => token[2].type === 'button'))
    assert.equal(new Set(switches.map(token => token[2]['aria-controls'])).size, 1)
    assert.equal(pipelineElements.filter(token => token[1] === 'img').length, 1)
    assert.match(pipelineElements.find(token => token[1] === 'img')[2].src, /architecture\.png$/)
    assert.match(pipeline, /project-media__viewport--diagram/)
    for (const article of work.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)) {
      assert.match(article[0], /^<article[^>]*><header class="work-showcase__heading"><h3/)
    }
    assert(!/<canvas|\d+%|\d+K|href="https:\/\/github/.test(pipeline))
    const olist = work.match(/<article\b[^>]*olist[^>]*>[\s\S]*?<\/article>/)[0]
    const olistElements = tokens(olist).filter(token => token[0] === 'start')
    assert.deepEqual([...olist.matchAll(/<button\b[^>]*>([^<]+)<\/button>/g)].map(match => match[1]),
      ['Executive overview', 'Sales analysis', 'Customer experience'])
    assert.deepEqual(olistElements.filter(token => token[1] === 'button').map(token => token[2]['aria-pressed']), ['true', 'false', 'false'])
    assert.equal(olistElements.filter(token => token[1] === 'img').length, 1)
    assert.match(olistElements.find(token => token[1] === 'img')[2].src, /executive-overview\.png$/)
    assert(!/aria-live=/.test(pipeline + olist)) // Pressed state is the selection announcement.
    const { projects } = await server.ssrLoadModule('/src/data/projects.js')
    assert.deepEqual(projects[0].media.map(image => image.label), ['Architecture Diagram', 'Airflow DAG', 'Star Schema'])
    for (const image of projects.flatMap(project => project.media)) {
      const bytes = readFileSync(new URL('../src/assets/images/' + image.src.split('/').pop(), import.meta.url))
      assert.equal(image.width, bytes.readUInt32BE(16))
      assert.equal(image.height, bytes.readUInt32BE(20))
      assert(image.alt.length > 20)
    }
    const headline = hero.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]
    assert.deepEqual(tokens(headline).filter(token => token[0] === 'text').map(token => token[1]),
      ["Hello, I'm Candra.", 'I build with data.'])
    assert.match(hero, /COMPUTER SCIENCE · DATA ENGINEERING &amp; ANALYTICS/)
    assert.match(hero, /Exploring data engineering and analytics through reliable pipelines, thoughtful analysis, and practical projects\./)
    const heroElements = tokens(hero).filter(token => token[0] === 'start')
    const heroLinks = heroElements.filter(token => token[1] === 'a')
    assert.deepEqual(heroLinks.map(token => token[2].href), ['#featured', '/portfolio/Candra_Wijaya_CV.pdf', '#about'])
    assert.match(hero, /Download CV/)
    assert.equal(heroLinks[1][2].target, '_blank')
    assert.equal(heroLinks[1][2].rel, 'noopener noreferrer')
    const svg = heroElements.find(token => token[1] === 'svg')[2]
    assert.equal(svg['aria-hidden'], 'true')
    assert.equal(svg.focusable, 'false')
    assert(!heroElements.some(token => token[1] === 'canvas'))
    assert(!/hero-typewriter|hero-orb|hero-reveal/.test(hero))
    assert(!/useEffect|HeroGreeting|HeroOrb|mountHeroFade/.test(read('../src/components/Hero.jsx')))
    const elements = tokens(markup).filter(token => token[0] === 'start')
    const headingLevels = elements.filter(token => /^h[1-6]$/.test(token[1])).map(token => Number(token[1][1]))
    assert.equal(headingLevels.filter(level => level === 1).length, 1)
    assert.equal(headingLevels[0], 1)
    assert(headingLevels.every((level, i) => i === 0 || level <= headingLevels[i - 1] + 1))
    assert.deepEqual(elements.filter(token => token[1] === 'section').map(token => token[2].id),
      ['home', 'about', 'featured', 'skills', 'contact'])
    const numberedLabels = tokens(markup).filter(token => token[0] === 'text' && /^0\d\s*\//.test(token[1])).map(token => token[1])
    assert.deepEqual(numberedLabels, ['01 / ABOUT ME', '02 / SELECTED WORK', '03 / SKILLS & CAPABILITIES', '04 / CONTACT'])
    assert.equal(elements.filter(token => token[1] === 'header' && token[2].class.split(' ').includes('site-header')).length, 1)
    assert.equal(elements.filter(token => token[1] === 'main').length, 1)
    assert.equal(elements.filter(token => token[1] === 'footer').length, 1)
    const ids = elements.map(token => token[2].id).filter(Boolean)
    assert.equal(new Set(ids).size, ids.length)
    for (const [, , attrs] of elements) {
      if (attrs.href?.startsWith('#')) assert(ids.includes(attrs.href.slice(1)), attrs.href)
      for (const key of ['aria-labelledby', 'aria-controls']) {
        for (const id of (attrs[key] || '').split(' ').filter(Boolean)) assert(ids.includes(id), id)
      }
    }
    const images = elements.filter(token => token[1] === 'img')
    assert.equal(images.length, 2) // One default screenshot per gallery; others load on selection.
    assert(images.every(token => token[2].src.startsWith('assets/images/')))
    for (const [, , attrs] of images) {
      const bytes = readFileSync(new URL('../src/' + attrs.src, import.meta.url))
      assert.equal(Number(attrs.width), bytes.readUInt32BE(16))
      assert.equal(Number(attrs.height), bytes.readUInt32BE(20))
      assert.equal(attrs.loading, 'lazy')
    }
    assert.equal(config.base, '/portfolio/')
    assert.equal(read('../src/styles/style.css'), read('../../css/style.css'))
    for (const file of ['executive-overview.png', 'sales-analysis.png', 'customer-experience.png',
      'architecture.png', 'airflow-workflow.png', 'star-schema.png']) {
      assert(readFileSync(new URL('../src/assets/images/' + file, import.meta.url))
        .equals(readFileSync(new URL('../../assets/images/' + file, import.meta.url))))
    }
    for (const file of ['lenis.LICENSE.txt', 'react-bits-orb.LICENSE.md']) {
      const license = read('../../js/vendor/' + file)
      assert.equal(read('../public/licenses/' + file), license)
      assert.equal(read('../src/vendor/' + file), license)
    }
    const head = html => html.match(/<head>([\s\S]*?)<\/head>/)[1]
    const fonts = html => [...head(html).matchAll(/<link[^>]*href="(https:[^"]+)"/g)].map(match => match[1])
    const currentFonts = fonts(read('../index.html'))
    // F1B removes only the obsolete V1 Barlow network request. Its retained
    // fallback styles do not match the active V2 sections.
    for (const font of fonts(read('../../index.html')).filter(url => !url.includes('family=Barlow+Condensed'))) assert(currentFonts.includes(font))
    assert(!currentFonts.some(url => url.includes('Barlow')))
    assert(!elements.some(token => (token[2].class || '').split(' ').some(name => ['hero', 'about'].includes(name))))
    for (const family of ['Inter', 'JetBrains+Mono', 'Space+Grotesk']) {
      assert(currentFonts.some(url => url.includes('family=' + family)))
    }
    assert.match(read('../src/main.jsx'), /<StrictMode>/)
    const sourceRoot = new URL('../src/', import.meta.url)
    for (const file of readdirSync(sourceRoot, { recursive: true }).filter(file => /\.(jsx|js)$/.test(file))) {
      const source = readFileSync(new URL(file.replaceAll('\\', '/'), sourceRoot), 'utf8')
      assert(!/(?:import|src=)[^\n]*(?:js\/script\.js|js\/hero-orb\.js|js\/smooth-scroll\.js|lenis-1\.3\.27\.min\.js)/.test(source), file)
    }
  } finally {
    await server.close()
  }
})

test('F1B metadata uses the verified production URL, V2 theme, minimal favicon and text-only sharing cards', () => {
  const html = read('../index.html')
  const title = 'Candra Wijaya | Data Engineering & Analytics Portfolio'
  const description = 'Explore projects in data engineering, analytics, ETL pipelines, and data visualization by Candra Wijaya.'
  const head = tokens(html.match(/<head>([\s\S]*?)<\/head>/)[1])
  const elements = head.filter(token => token[0] === 'start').map(token => [token[1], token[2]])
  const meta = key => elements.filter(([tag, attrs]) => tag === 'meta' && (attrs.name === key || attrs.property === key)).map(([, attrs]) => attrs.content)
  assert.equal(decode(html.match(/<title>([^<]+)<\/title>/)[1]), title)
  for (const key of ['description', 'og:description', 'twitter:description']) assert.deepEqual(meta(key), [description])
  for (const key of ['og:title', 'twitter:title']) assert.deepEqual(meta(key), [title])
  assert.deepEqual(meta('theme-color'), ['#080D16'])
  assert.deepEqual(meta('og:type'), ['website'])
  assert.deepEqual(meta('og:url'), ['https://udeenc.github.io/portfolio/'])
  assert.deepEqual(meta('twitter:card'), ['summary'])
  assert.deepEqual(meta('og:image'), [])
  assert.deepEqual(meta('twitter:image'), [])
  assert.deepEqual(elements.filter(([tag, attrs]) => tag === 'link' && attrs.rel === 'canonical').map(([, attrs]) => attrs.href), ['https://udeenc.github.io/portfolio/'])
  const icons = elements.filter(([tag, attrs]) => tag === 'link' && attrs.rel === 'icon')
  assert.equal(icons.length, 1)
  assert.equal(icons[0][1].href, '%BASE_URL%favicon.svg')
  assert.equal(icons[0][1].type, 'image/svg+xml')
  const favicon = read('../public/favicon.svg')
  assert.match(favicon, /viewBox="0 0 64 64"/)
  for (const color of ['#080D16', '#61E8DB']) assert(favicon.includes(color))
  assert(!/<script|<image|<foreignObject|\bhref=/.test(favicon))
  assert(!/localhost|127\.0\.0\.1/.test(html))
})

test('Contact activates owner-approved email and base-aware CV while preserving social destinations and footer', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const markup = renderToStaticMarkup(createElement(App))
    const original = read('../../index.html')
    const contact = markup.match(/<section\b[^>]*id="contact"[^>]*>[\s\S]*?<\/section>/)[0]
    const contactTokens = tokens(contact)
    const text = contactTokens.filter(token => token[0] === 'text').map(token => token[1])
    assert(text.includes('04 / CONTACT'))
    assert(text.includes("Let's build something meaningful."))
    assert(text.includes("I'm open to internship opportunities and conversations around data engineering, analytics, and software development."))
    assert.match(contact, /aria-labelledby="contact-title"/)
    assert.match(contact, /<h2 id="contact-title">/)
    assert(!/<h[13456]\b/.test(contact))
    const rows = [...contact.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => match[1])
    assert.equal(rows.length, 4)
    assert.deepEqual(rows.map(row => decode(row.match(/class="contact-v2__label">([^<]+)</)[1])),
      ['Email Me', 'GitHub', 'LinkedIn', 'View My CV'])
    assert(rows.every(row => /^<a\b/.test(row)))
    assert(!/Unavailable|Coming Soon|row--unavailable/.test(contact))
    assert.match(rows[3], /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/)
    const links = contactTokens.filter(token => token[0] === 'start' && token[1] === 'a').map(token => token[2])
    assert.deepEqual(links.map(link => link.href), ['mailto:wijayac2005@gmail.com', 'https://github.com/udeenc',
      'https://www.linkedin.com/in/candra-wijaya-36a008347', '/portfolio/Candra_Wijaya_CV.pdf'])
    assert.equal(links[0].target, undefined) // Email uses the configured mail handler.
    for (const link of links.slice(1)) {
      assert.equal(link.target, '_blank')
      assert.equal(link.rel, 'noopener noreferrer')
    }
    for (const link of links.slice(1, 3)) assert(original.includes('href="' + link.href + '"'), 'Preserve social destinations')
    assert.match(rows[3], /contact-v2__row--cv/)
    assert.match(rows[3], /PDF, opens in a new tab/)
    assert.equal((contact.match(/opens in a new tab/g) || []).length, 3)
    assert(!/href="#"/.test(contact))
    assert.match(read('../src/data/contact.js'), /import\.meta\.env\.BASE_URL/)
    for (const component of ['Contact', 'Hero']) assert.match(read('../src/components/' + component + '.jsx'), /import \{ cvUrl \} from '\.\.\/data\/contact\.js'/)
    const pdf = readFileSync(new URL('../public/Candra_Wijaya_CV.pdf', import.meta.url))
    assert(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')))
    assert(pdf.subarray(-1024).toString('latin1').includes('%%EOF'))
    assert(pdf.length > 10000, 'The approved document must not be placeholder bytes')
    const footerPattern = /<footer\b[^>]*>[\s\S]*?<\/footer>/
    const footer = markup.match(footerPattern)[0]
    const originalFooter = original.match(footerPattern)[0].replace(/(<span id="year">)\d{4}/, '$1' + new Date().getFullYear())
    const footerText = html => tokens(html).filter(token => token[0] === 'text')
    assert.deepEqual(footerText(footer), footerText(originalFooter))
    const footerLinks = tokens(footer).filter(token => token[0] === 'start' && token[1] === 'a')
    assert.deepEqual(footerLinks.map(token => token[2].href), ['#home'])
    assert.match(markup, /<section[^>]*id="home"/)
    assert(!/04 \/|Coming Soon/.test(footer))
    assert.match(read('../src/components/Footer.jsx'), /new Date\(\)\.getFullYear\(\)/)
    const css = read('../src/styles/contact-v2.css')
    assert.match(css, /@media \(max-width: 800px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
    assert.match(css, /min-height: 44px/)
    assert.match(css, /overflow-wrap: anywhere/)
    assert.match(css, /:focus-visible/)
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/)
    assert(!/animation:|:hover[^}]*transform:/.test(css))
  } finally {
    await server.close()
  }
})
