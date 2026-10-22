import test from 'node:test'
import assert from 'node:assert/strict'
import { setMaxListeners } from 'node:events'
import { readFileSync } from 'node:fs'
import { createHeroProgress, heroScrollProgress, mountHeroDissolve } from '../src/effects/heroDissolve.js'
import { createConstellationData, createDissolveOffsets } from '../src/data/constellation3d.js'
setMaxListeners(0)

class Target extends EventTarget {
  handlers = new Set()
  addEventListener(type, fn, options) {
    super.addEventListener(type, fn, options)
    const key = { type, fn }; this.handlers.add(key)
    options?.signal?.addEventListener('abort', () => this.handlers.delete(key), { once: true })
  }
  fire(type) { this.dispatchEvent(new Event(type)) }
}
function environment() {
  const win = new Target(), doc = new Target(), motion = new Target(), fonts = new Target()
  const values = new Map(), frames = new Map(), observers = []
  const rootValues = new Map()
  doc.documentElement = { style: {
    getPropertyValue: key => rootValues.get(key) || '', getPropertyPriority: () => '',
    setProperty: (key, value) => rootValues.set(key, value), removeProperty: key => rootValues.delete(key),
  } }
  const progress = createHeroProgress()
  let id = 0, reads = 0, nextTop = 900, height = 85, finishFonts
  win.scrollY = 0
  win.matchMedia = () => motion
  win.requestAnimationFrame = fn => { frames.set(++id, fn); return id }
  win.cancelAnimationFrame = key => frames.delete(key)
  const next = { getBoundingClientRect: () => { reads++; return { top: nextTop - win.scrollY } } }
  const header = { getBoundingClientRect: () => { reads++; return { height } } }
  const hero = { nextElementSibling: next,
    style: { setProperty: (key, value) => values.set(key, value), removeProperty: key => values.delete(key) },
    getBoundingClientRect: () => { reads++; return { top: height - win.scrollY, bottom: nextTop - win.scrollY } } }
  doc.querySelector = () => header
  doc.fonts = fonts
  fonts.ready = new Promise(resolve => { finishFonts = resolve })
  win.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() { this.connected = true }
    disconnect() { this.connected = false }
  }
  return { win, doc, hero, motion, fonts, frames, values, rootValues, progress, observers,
    mount: () => mountHeroDissolve(hero, progress, { win, doc }),
    step() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()) },
    scroll(y, type = 'scroll') { win.scrollY = y; win.fire(type) },
    geometry(top, headerHeight = height) { nextTop = top; height = headerHeight },
    reads: () => reads,
    async finishFonts() { finishFonts(); await Promise.resolve() },
    clean() {
      assert.equal(values.size, 0); assert.equal(frames.size, 0)
      assert([win, doc, motion, fonts].every(t => !t.handlers.size))
      assert(observers.every(observer => !observer.connected))
    },
  }
}

test('scroll progress clamps and is independent of travel history; offsets are deterministic and bounded', () => {
  for (const [y, expected] of [[-20, 0], [0, 0], [400, .5], [800, 1], [5000, 1], [400, .5], [0, 0]]) {
    assert.equal(heroScrollProgress(y, 0, 800), expected)
  }
  assert.equal(heroScrollProgress(200, 100, 100), 1)
  assert.equal(heroScrollProgress(NaN, 0, 800), 0)
  const nodes = createConstellationData().nodes
  const before = structuredClone(nodes), offsets = createDissolveOffsets(nodes)
  assert.deepEqual(offsets, createDissolveOffsets(nodes)); assert.deepEqual(nodes, before)
  assert(offsets.every(vector => Math.hypot(...vector) <= 2.2 && vector.every(Number.isFinite)))
})

test('native and Lenis scroll share cached geometry and one pending update; anchor jumps reverse immediately', () => {
  const env = environment(), cleanup = env.mount()
  assert.equal(env.progress.value, 0)
  assert.equal(env.values.get('--lab-content-opacity'), '1')
  const initialReads = env.reads()
  env.scroll(815 * .2); env.step()
  assert.equal(env.values.get('--lab-content-opacity'), '1')
  env.scroll(815 * .75); env.scroll(815 * .75)
  assert.equal(env.frames.size, 1)
  env.win.fire('portfolio:smooth-scroll')
  assert.equal(env.frames.size, 0)
  assert.equal(env.progress.value, .75)
  const opacity = env.values.get('--lab-content-opacity')
  assert(Math.abs(Number(opacity) - .5) < .00001)
  env.scroll(4000, 'portfolio:smooth-scroll'); assert.equal(env.progress.value, 1)
  env.scroll(815 * .75, 'portfolio:smooth-scroll')
  assert.equal(env.values.get('--lab-content-opacity'), opacity)
  env.scroll(0, 'portfolio:smooth-scroll')
  assert.equal(env.values.get('--lab-content-opacity'), '1')
  assert.equal(env.values.get('--lab-content-shift'), '0px')
  assert.equal(env.reads(), initialReads)
  cleanup(); env.clean()
})

test('resize, observer and font completion remeasure; hidden/page lifecycle resumes latest native position', async () => {
  const env = environment(), cleanup = env.mount()
  env.geometry(1085); env.scroll(500); env.win.fire('resize'); env.step()
  assert.equal(env.progress.value, .5)
  env.geometry(2085); env.observers[0].callback(); env.step()
  assert.equal(env.progress.value, .25)
  env.geometry(1085); await env.finishFonts(); env.step(); assert.equal(env.progress.value, .5)
  env.geometry(2085); env.fonts.fire('loadingdone'); env.step(); assert.equal(env.progress.value, .25)
  env.doc.hidden = true; env.doc.fire('visibilitychange'); env.scroll(1000)
  assert.equal(env.frames.size, 0)
  env.doc.hidden = false; env.doc.fire('visibilitychange'); env.step()
  assert.equal(env.progress.value, .5)
  env.win.fire('pagehide'); env.scroll(2000); assert.equal(env.frames.size, 0)
  env.win.fire('pageshow'); env.step(); assert.equal(env.progress.value, 1)
  cleanup(); env.clean()
})

test('reduced motion resets scroll animation and styles; cleanup prevents late font work on replay', async () => {
  const env = environment()
  for (let i = 0; i < 2; i++) {
    const cleanup = env.mount()
    env.scroll(700, 'portfolio:smooth-scroll'); assert(env.progress.value > .8)
    env.motion.matches = true; env.motion.fire('change')
    assert.equal(env.progress.value, 0); assert.equal(env.values.size, 0)
    env.scroll(750, 'portfolio:smooth-scroll'); assert.equal(env.values.size, 0)
    env.motion.matches = false; env.motion.fire('change'); assert(env.progress.value > .9)
    env.scroll(0); cleanup(); cleanup(); env.clean()
  }
  await env.finishFonts(); env.clean()
})

test('focused CTA/scroll indicator override fading; no hidden, inert or tab-order mutations are used', () => {
  const css = readFileSync(new URL('../src/styles/hero-v2.css', import.meta.url), 'utf8')
  assert.match(css, /\.lab-hero__content:focus-within, \.lab-hero__scroll:focus\s*\{\s*opacity: 1; transform: none;/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.lab-hero__content, \.lab-hero__scroll, \.lab-constellation-layer \{ opacity: 1; transform: none;/)
  const source = readFileSync(new URL('../src/effects/heroDissolve.js', import.meta.url), 'utf8')
  assert(!/aria-hidden|inert|tabindex|preventDefault/.test(source))
})

test('orientation/zoom-sized header changes update viewport and anchor offsets even with reduced motion', () => {
  const env = environment()
  env.rootValues.set('--lab-sticky-header-height', '90px')
  const cleanup = env.mount()
  assert.equal(env.rootValues.get('--lab-sticky-header-height'), '85px')
  env.geometry(1100, 100); env.scroll(500); env.win.fire('orientationchange'); env.step()
  assert.equal(env.progress.value, .5)
  assert.equal(env.rootValues.get('--lab-sticky-header-height'), '100px')
  env.motion.matches = true; env.motion.fire('change')
  env.geometry(1200, 200); env.win.fire('resize'); env.step()
  assert.equal(env.rootValues.get('--lab-sticky-header-height'), '200px')
  assert.equal(env.progress.value, 0); assert.equal(env.values.size, 0)
  cleanup(); env.clean()
  assert.equal(env.rootValues.get('--lab-sticky-header-height'), '90px')
})
