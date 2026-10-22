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

test('React markup, copy, section order, links, assets and licenses match the original', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const markup = renderToStaticMarkup(createElement(App))
    const original = read('../../index.html').match(/<body>([\s\S]*?)<\/body>/)[1]
      // The original script also updates this year after loading.
      .replace(/(<span id="year">)\d{4}/, '$1' + new Date().getFullYear())
    // The only additional node is the React-owned decorative canvas, created
    // imperatively by the original renderer after page load.
    const comparable = markup.replace(/<canvas\b[^>]*><\/canvas>/g, '')
    assert.deepEqual(tokens(comparable), tokens(original))
    const elements = tokens(markup).filter(token => token[0] === 'start')
    assert.deepEqual(elements.filter(token => token[1] === 'section').map(token => token[2].id),
      ['home', 'about', 'featured', 'projects', 'skills', 'education', 'contact'])
    assert.equal(elements.filter(token => token[1] === 'header').length, 1)
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
    assert.equal(images.length, 3)
    assert(images.every(token => token[2].src.startsWith('assets/images/')))
    assert.equal(config.base, '/portfolio/')
    assert.equal(read('../src/styles/style.css'), read('../../css/style.css'))
    for (const file of ['executive-overview.png', 'sales-analysis.png', 'customer-experience.png']) {
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
    assert.deepEqual(fonts(read('../index.html')), fonts(read('../../index.html')))
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
