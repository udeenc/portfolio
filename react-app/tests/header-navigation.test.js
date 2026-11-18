import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mountHeaderMenu, mountHeaderNavigation, navigationLinks } from '../src/effects/headerNavigation.js'

class Target extends EventTarget {
  listeners = new Set()
  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options)
    this.listeners.add(listener)
    options?.signal?.addEventListener('abort', () => this.listeners.delete(listener), { once: true })
  }
  fire(type, properties = {}) {
    const event = new Event(type)
    for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value })
    this.dispatchEvent(event)
  }
}

function environment({ observer = true } = {}) {
  const win = new Target(), doc = new Target(), media = new Target(), observers = []
  Object.assign(win, { scrollY: 0, innerHeight: 800 })
  media.matches = true
  win.matchMedia = () => media
  let reads = 0, headerHeight = 85, clearance = 100, resolveFonts
  const elements = navigationLinks.map(({ id }, i) => ({ id, top: 1000 + i * 1000,
    getBoundingClientRect() { reads++; return { top: this.top - win.scrollY } } }))
  const header = { getBoundingClientRect() { reads++; return { height: headerHeight } } }
  doc.documentElement = { scrollHeight: 4500 }
  doc.body = { scrollHeight: 4500 }
  doc.getElementById = id => elements.find(element => element.id === id)
  doc.fonts = new Target()
  doc.fonts.ready = new Promise(resolve => { resolveFonts = resolve })
  win.getComputedStyle = () => ({ scrollPaddingTop: String(clearance) })
  if (observer) win.ResizeObserver = class {
    observed = []; disconnected = false
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe(element) { this.observed.push(element) }
    disconnect() { this.disconnected = true }
  }
  const active = [], surfaces = []
  const mount = () => mountHeaderNavigation(header, value => active.push(value), value => surfaces.push(value), { win, doc })
  const scroll = (y, type = 'scroll') => { win.scrollY = y; win.fire(type) }
  return { win, doc, media, elements, observers, active, surfaces, mount, scroll, resolveFonts,
    reads: () => reads, resizeHeader: value => { headerHeight = value; clearance = value + 16 } }
}

test('active navigation follows native/Lenis positions, reverse/anchor jumps and short closing sections without per-scroll layout reads', () => {
  const env = environment(), stop = env.mount(), reads = env.reads()
  assert.deepEqual(env.active, [null])
  env.scroll(900); assert.equal(env.active.at(-1), 'about')
  const changes = env.active.length
  env.scroll(905, 'portfolio:smooth-scroll'); env.scroll(906)
  assert.equal(env.active.length, changes)
  env.scroll(1900, 'portfolio:smooth-scroll'); assert.equal(env.active.at(-1), 'featured')
  env.scroll(1897); assert.equal(env.active.at(-1), 'featured') // Ignore boundary jitter.
  env.scroll(1890); assert.equal(env.active.at(-1), 'about')
  env.scroll(2900, 'hashchange'); assert.equal(env.active.at(-1), 'skills')
  env.scroll(3700); assert.equal(env.active.at(-1), 'contact') // Contact top cannot reach activation line.
  env.scroll(2900, 'popstate'); assert.equal(env.active.at(-1), 'skills')
  env.scroll(900); assert.equal(env.active.at(-1), 'about')
  env.scroll(0); assert.equal(env.active.at(-1), null)
  assert.equal(env.reads(), reads)
  stop()
})

test('header surface uses threshold hysteresis and emits only actual changes', () => {
  const env = environment(), stop = env.mount()
  assert.deepEqual(env.surfaces, [false])
  for (const y of [10, 24, 25, 24, 15, 13, 12, 11, 0]) env.scroll(y)
  assert.deepEqual(env.surfaces, [false, true, false])
  stop()
})

test('layout/font changes refresh cached geometry; cleanup and Strict Mode replay leave no listeners or observers', async () => {
  const env = environment()
  for (let replay = 0; replay < 2; replay++) {
    const stop = env.mount()
    const observer = env.observers.at(-1)
    assert.equal(observer.observed.length, 6)
    env.elements[0].top = 1200
    env.resizeHeader(120)
    observer.callback()
    env.scroll(1065); assert.equal(env.active.at(-1), 'about')
    env.elements[0].top = 1400
    env.doc.fonts.fire('loadingdone'); assert.equal(env.active.at(-1), null)
    stop()
    assert(observer.disconnected)
    for (const target of [env.win, env.doc.fonts]) assert.equal(target.listeners.size, 0)
    const reads = env.reads(), changes = env.active.length
    env.resolveFonts(); await Promise.resolve()
    env.scroll(5000); observer.callback()
    assert.equal(env.reads(), reads)
    assert.equal(env.active.length, changes)
    env.elements[0].top = 1000; env.scroll(0)
  }
})

test('navigation remains functional without ResizeObserver or animation APIs', () => {
  const env = environment({ observer: false }), stop = env.mount()
  env.scroll(2900); assert.equal(env.active.at(-1), 'skills')
  env.elements[2].top = 3500; env.win.fire('resize')
  assert.equal(env.active.at(-1), 'featured')
  stop()
})

test('mobile disclosure toggles, closes on selection/Escape/outside focus, repairs breakpoint focus and cleans up', () => {
  const env = environment(), toggle = new Target(), menu = new Target(), link = new Target()
  const outsider = {}, changes = []
  toggle.contains = element => element === toggle
  menu.contains = element => element === link || element === menu
  menu.querySelector = () => link
  toggle.focus = () => { env.doc.activeElement = toggle }
  link.focus = () => { env.doc.activeElement = link }
  link.closest = selector => selector === 'a[href]' ? link : null
  for (let replay = 0; replay < 2; replay++) {
    env.media.matches = true
    const stop = mountHeaderMenu(toggle, menu, value => changes.push(value), env)
    toggle.fire('click'); assert.equal(changes.at(-1), true)
    env.doc.fire('keydown', { key: 'Tab' }); assert.equal(changes.at(-1), true) // No Tab trap.
    menu.fire('click', { target: link }); assert.equal(changes.at(-1), false)
    toggle.fire('click'); env.doc.fire('keydown', { key: 'Escape' })
    assert.equal(changes.at(-1), false); assert.equal(env.doc.activeElement, toggle)
    toggle.fire('click'); env.doc.fire('focusin', { target: outsider })
    assert.equal(changes.at(-1), false)
    toggle.fire('click'); env.doc.fire('pointerdown', { target: outsider })
    assert.equal(changes.at(-1), false)
    toggle.fire('click'); env.doc.activeElement = toggle
    env.media.matches = false; env.media.fire('change')
    assert.equal(changes.at(-1), false); assert.equal(env.doc.activeElement, link)
    env.media.matches = true; env.media.fire('change')
    assert.equal(env.doc.activeElement, toggle)
    stop()
    for (const target of [toggle, menu, env.doc, env.media]) assert.equal(target.listeners.size, 0)
    const count = changes.length
    toggle.fire('click'); env.doc.fire('keydown', { key: 'Escape' })
    assert.equal(changes.length, count)
  }
})

test('header CSS preserves stable geometry, hidden mobile links, focus, small-screen identity and reduced motion', () => {
  const css = readFileSync(new URL('../src/styles/header-v2.css', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  assert.match(css, /\.nav-links\.is-collapsed\s*\{ display: none/)
  assert.match(css, /position: absolute; top: 100%/)
  assert.match(css, /flex-wrap: nowrap/)
  assert.match(css, /min-height: 48px/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/)
  assert.match(css, /@media \(max-width: 430px\)/)
  assert.match(component, /aria-current=\{active === id \? 'location' : undefined\}/)
  assert.match(component, /aria-expanded=\{menuOpen\}/)
  assert.match(component, /menuOpen \? 'Close navigation menu' : 'Open navigation menu'/)
  assert(!/requestAnimationFrame|setInterval|preventDefault|pushState/.test(readFileSync(new URL('../src/effects/headerNavigation.js', import.meta.url), 'utf8')))
})
