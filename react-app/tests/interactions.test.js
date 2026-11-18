import test from 'node:test'
import assert from 'node:assert/strict'
import { setMaxListeners } from 'node:events'
import { readFileSync } from 'node:fs'
import { mountTypewriter, greetings } from '../src/effects/typewriter.js'
import { mountCursor } from '../src/effects/cursor.js'
import { mountHeroFade } from '../src/effects/heroFade.js'
import { mountAboutReveal } from '../src/effects/aboutReveal.js'
import { initHeroOrb } from '../src/effects/orbRenderer.js'
import { mountSmoothScroll } from '../src/effects/smoothScroll.js'
setMaxListeners(0)

class Target {
  listeners = new Map()
  addEventListener(type, fn, options = {}) {
    if (options.signal?.aborted) return
    const entries = this.listeners.get(type) || new Map()
    const remove = () => this.removeEventListener(type, fn)
    entries.set(fn, { options, remove })
    this.listeners.set(type, entries)
    options.signal?.addEventListener('abort', remove, { once: true })
  }
  removeEventListener(type, fn) {
    const entry = this.listeners.get(type)?.get(fn)
    entry?.options.signal?.removeEventListener('abort', entry.remove)
    this.listeners.get(type)?.delete(fn)
  }
  fire(type, properties = {}) {
    const event = { type, target: this, stopPropagation() {}, preventDefault() { this.defaultPrevented = true }, ...properties }
    for (const [fn, { options }] of [...(this.listeners.get(type) || [])]) {
      if (options.once) this.removeEventListener(type, fn)
      fn(event)
    }
    return event
  }
  dispatchEvent(event) { this.fire(event.type, event); return true }
  count() { return [...this.listeners.values()].reduce((n, entries) => n + entries.size, 0) }
}
class Element extends Target {
  classes = new Set()
  attrs = new Map()
  style = { setProperty(key, value) { this[key] = value }, removeProperty(key) { delete this[key] } }
  classList = {
    add: (...names) => names.forEach(name => this.classes.add(name)),
    remove: (...names) => names.forEach(name => this.classes.delete(name)),
    contains: name => this.classes.has(name),
    toggle: (name, on) => { if (on) this.classes.add(name); else this.classes.delete(name) },
    [Symbol.iterator]: () => this.classes[Symbol.iterator](),
  }
  clientWidth = 400
  clientHeight = 400
  scrollHeight = 3000
  scrollWidth = 1400
  bounds = { top: 100, bottom: 1000, height: 85, left: 0 }
  getBoundingClientRect() { return this.bounds }
  setAttribute(key, value) { this.attrs.set(key, value) }
  getAttribute(key) { return this.attrs.get(key) }
  hasAttribute(key) { return this.attrs.has(key) }
  removeAttribute(key) { this.attrs.delete(key) }
  closest(selector) {
    if (selector === 'a[href]') return this.href ? this : null
    return selector.startsWith('input,') ? (this.editable ? this : null) : (this.interactive ? this : null)
  }
  focus() { this.focused = true }
}
class Window extends Target {}

function environment() {
  const targets = []
  const make = (Type = Target) => { const target = new Type(); targets.push(target); return target }
  const win = make(Window)
  const doc = make()
  const root = make(Element)
  const hero = make(Element)
  const header = make(Element)
  const overlap = make(Element)
  const media = new Map()
  const frames = new Map()
  const timers = new Map()
  const observers = []
  let id = 0
  class Observer {
    observed = new Set()
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe(target) { this.observed.add(target) }
    unobserve(target) { this.observed.delete(target) }
    disconnect() { this.observed.clear() }
    emit(target, isIntersecting = true) { this.callback([{ target, isIntersecting }]) }
  }
  const motion = '(prefers-reduced-motion: reduce)'
  win.matchMedia = query => {
    if (!media.has(query)) { const target = make(); target.matches = query.includes('pointer: fine') && !query.includes('max-width'); media.set(query, target) }
    return media.get(query)
  }
  win.IntersectionObserver = win.ResizeObserver = Observer
  win.requestAnimationFrame = callback => { frames.set(++id, callback); return id }
  win.cancelAnimationFrame = key => frames.delete(key)
  win.setTimeout = (callback, delay) => { timers.set(++id, { callback, delay }); return id }
  win.clearTimeout = key => timers.delete(key)
  win.innerWidth = 1400
  win.innerHeight = 900
  win.scrollY = win.scrollX = 0
  win.location = new URL('https://example.com/portfolio/')
  win.history = { state: null, pushState(_state, _title, hash) { win.location.hash = hash } }
  win.scrollTo = ({ top = win.scrollY, left = win.scrollX }) => { win.scrollY = top; win.scrollX = left }
  doc.hidden = false
  doc.documentElement = root
  doc.body = make(Element)
  doc.fonts = make()
  doc.fonts.ready = Promise.resolve()
  doc.querySelector = selector => ({ '.site-header': header, '.about-overlap': overlap })[selector]
  doc.getElementById = () => hero
  doc.elementFromPoint = () => hero
  Object.assign(globalThis, {
    window: win, document: doc, Element, HTMLElement: Element, Window,
    IntersectionObserver: Observer, ResizeObserver: Observer,
    requestAnimationFrame: win.requestAnimationFrame, cancelAnimationFrame: win.cancelAnimationFrame,
    getComputedStyle: () => ({ scrollPaddingTop: '100', overflowX: 'visible', overflowY: 'visible' }),
  })
  return {
    win, doc, root, hero, header, overlap, media, frames, timers, observers, make,
    reduce(value) { const m = win.matchMedia(motion); m.matches = value; m.fire('change') },
    frame(time = 16.67) { const jobs = [...frames.values()]; frames.clear(); jobs.forEach(callback => callback(time)) },
    timer(delay) { const [key, job] = timers.entries().next().value; assert.equal(job.delay, delay); timers.delete(key); job.callback() },
    listeners() { return targets.reduce((count, target) => count + target.count(), 0) },
  }
}

test('typewriter preserves messages and timings, pauses/resumes, and cleans up replay', () => {
  const e = environment()
  let view
  let stop = mountTypewriter(e.hero, next => { view = next })
  e.observers[0].emit(e.hero)
  assert.equal(e.timers.size, 1)
  e.timer(800)
  for (let i = 1; i < greetings[0].length; i++) e.timer(55)
  assert.equal(view.text, greetings[0])
  e.timer(2000)
  assert.equal(view.changing, true)
  e.timer(180)
  for (let i = 0; i < greetings[1].length; i++) e.timer(55)
  assert.equal(view.text, greetings[1])
  e.timer(2000); e.timer(180)
  for (let i = 0; i < greetings[2].length; i++) e.timer(55)
  assert.equal(view.text, greetings[2])
  e.doc.hidden = true; e.doc.fire('visibilitychange')
  assert.equal(e.timers.size, 0)
  e.doc.hidden = false; e.doc.fire('visibilitychange')
  assert.equal(e.timers.size, 1)
  e.observers[0].emit(e.hero, false)
  assert.equal(e.timers.size, 0)
  e.observers[0].emit(e.hero)
  e.reduce(true)
  assert.equal(view.text, greetings[0]); assert.equal(view.typing, false)
  assert.equal(e.timers.size, 0)
  stop()
  assert.equal(e.listeners(), 0)
  e.reduce(false)
  stop = mountTypewriter(e.hero, next => { view = next })
  e.observers.at(-1).emit(e.hero)
  assert.equal(e.timers.size, 1)
  stop(); assert.equal(e.timers.size, 0); assert.equal(e.listeners(), 0)
})

test('cursor trails at .25, resolves hover during scroll, and respects native/touch input', () => {
  const e = environment()
  const cursor = e.make(Element)
  const stop = mountCursor(cursor)
  e.doc.fire('pointermove', { pointerType: 'mouse', clientX: 0, clientY: 0, target: e.hero })
  e.doc.fire('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 40, target: e.hero })
  assert.equal(e.frames.size, 1)
  e.frame()
  assert.match(cursor.style.transform, /translate3d\(25px, 10px/)
  e.hero.interactive = true
  e.doc.fire('scroll')
  assert(cursor.classList.contains('is-interactive'))
  assert(e.root.classList.contains('custom-cursor-active'))
  e.doc.fire('keydown', { key: 'Tab' })
  assert(!cursor.classList.contains('is-visible'))
  assert(!e.root.classList.contains('custom-cursor-active'))
  e.doc.fire('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 40, target: e.hero })
  e.hero.editable = true; e.doc.fire('scroll')
  assert(!e.root.classList.contains('custom-cursor-active'))
  e.doc.fire('pointermove', { pointerType: 'touch' })
  assert(!cursor.classList.contains('is-visible'))
  e.reduce(true) // Combined media query is changed separately, like a browser.
  const capability = [...e.media.values()].find(m => m !== e.win.matchMedia('(prefers-reduced-motion: reduce)'))
  capability.matches = false; capability.fire('change')
  stop(); assert.equal(e.frames.size, 0); assert.equal(e.listeners(), 0)
})

test('Hero fade reverses, measures font/header changes, and cancels after unmount', async () => {
  const e = environment()
  e.hero.bounds = { top: 85, bottom: 1085 }
  e.overlap.bounds = { top: 1085 }
  const stop = mountHeroFade(e.hero)
  e.frame()
  assert.equal(e.hero.style['--hero-opacity'], '1')
  e.win.scrollY = 500
  e.win.fire('scroll'); e.frame()
  assert.equal(e.hero.style['--hero-opacity'], '0.5')
  e.win.scrollY = 0; e.win.fire('scroll'); e.frame()
  assert.equal(e.hero.style['--hero-opacity'], '1')
  e.header.bounds.height = 120; e.doc.fonts.fire('loadingdone'); e.frame()
  assert.equal(e.hero.style['--hero-header-height'], '120px')
  e.reduce(true)
  assert.equal(e.hero.style['--hero-opacity'], undefined)
  stop(); await Promise.resolve()
  assert.equal(e.frames.size, 0); assert.equal(e.listeners(), 0)
  assert(e.observers.every(observer => !observer.observed.size))
})

test('About reveals once, remains visible without observers, and handles reduced motion', () => {
  const e = environment()
  const item = e.make(Element)
  e.hero.querySelectorAll = () => [item]
  const stop = mountAboutReveal(e.hero)
  const observer = e.observers[0]
  observer.emit(item)
  assert(item.classList.contains('is-revealed'))
  assert.equal(observer.observed.size, 0)
  e.reduce(true)
  assert(!item.classList.contains('is-revealed'))
  e.reduce(false)
  assert.equal(observer.observed.size, 0)
  stop(); assert.equal(e.listeners(), 0)
  delete e.win.IntersectionObserver
  assert.equal(mountAboutReveal(e.hero), undefined)
})

function gpu() {
  const counts = { programs: 0, buffers: 0, arrays: 0, draws: 0, contextLosses: 0 }
  const gl = {
    ACTIVE_UNIFORMS: 0,
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true, deleteShader() {},
    createProgram() { counts.programs++; return {} }, deleteProgram() { counts.programs-- },
    attachShader() {}, bindAttribLocation() {}, linkProgram() {}, getProgramParameter: (_p, type) => type === 0 ? 0 : true,
    createBuffer() { counts.buffers++; return {} }, deleteBuffer() { counts.buffers-- },
    createVertexArray() { counts.arrays++; return {} }, deleteVertexArray() { counts.arrays-- },
    bindVertexArray() {}, bindBuffer() {}, bufferData() {}, enableVertexAttribArray() {}, vertexAttribPointer() {},
    getExtension: name => name === 'WEBGL_lose_context' ? { loseContext() { counts.contextLosses++ } } : null,
    isContextLost: () => counts.contextLosses > 0, viewport() {}, useProgram() {}, uniform2f() {}, uniform1f() {}, uniform3fv() {},
    drawArrays() { counts.draws++ },
  }
  return { gl, counts }
}

test('Orb retains shader source, isolates resources, and survives mount/cleanup replay', () => {
  const original = readFileSync(new URL('../../js/hero-orb.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const migrated = readFileSync(new URL('../src/effects/orbRenderer.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  for (const name of ['VERTEX', 'FRAGMENT']) {
    const shader = new RegExp('const ' + name + ' = `([\\s\\S]*?)`;')
    assert.equal(original.match(shader)[1], migrated.match(shader)[1])
  }
  const e = environment()
  const canvas = e.make(Element)
  const { gl, counts } = gpu()
  canvas.getContext = () => gl
  let renderer = initHeroOrb(e.hero, canvas)
  assert.equal(initHeroOrb(e.hero, canvas), renderer)
  e.observers.find(observer => observer.observed.has(e.hero) && observer !== e.observers[0]).emit(e.hero)
  e.frame()
  assert.equal(counts.draws, 1)
  assert.equal(e.frames.size, 1)
  renderer.destroy(); renderer.destroy()
  assert.equal(e.frames.size, 0); assert.equal(e.listeners(), 0)
  assert.equal(counts.programs + counts.buffers + counts.arrays, 0)
  renderer = initHeroOrb(e.hero, canvas)
  e.observers.at(-1).emit(e.hero); e.frame()
  assert.equal(counts.draws, 2)
  e.reduce(true)
  assert.equal(e.frames.size, 0)
  assert(!e.hero.classList.contains('is-orb-ready'))
  renderer.destroy(); assert.equal(e.listeners(), 0)
})

test('Orb handles context loss, hidden/offscreen/narrow states and WebGL failure', () => {
  const e = environment()
  const canvas = e.make(Element)
  let device = gpu()
  canvas.getContext = () => device.gl
  const renderer = initHeroOrb(e.hero, canvas)
  const intersection = e.observers.at(-1)
  intersection.emit(e.hero); e.frame()
  canvas.fire('webglcontextlost')
  assert.equal(e.frames.size, 0)
  assert(!e.hero.classList.contains('is-orb-ready'))
  device = gpu(); canvas.fire('webglcontextrestored'); e.frame()
  assert.equal(device.counts.draws, 1)
  e.doc.hidden = true; e.doc.fire('visibilitychange'); assert.equal(e.frames.size, 0)
  e.doc.hidden = false; e.doc.fire('visibilitychange'); assert.equal(e.frames.size, 1)
  intersection.emit(e.hero, false); assert.equal(e.frames.size, 0)
  intersection.emit(e.hero)
  const compact = e.win.matchMedia('(max-width: 800px)'); compact.matches = true; compact.fire('change')
  assert.equal(e.frames.size, 0)
  renderer.destroy()
  canvas.getContext = () => null
  compact.matches = false
  const failed = initHeroOrb(e.hero, canvas)
  e.observers.at(-1).emit(e.hero)
  assert.equal(e.frames.size, 0)
  assert(!e.hero.classList.contains('is-orb-ready'))
  failed.destroy(); assert.equal(e.listeners(), 0)
})

test('local Lenis starts idle, keeps one wheel loop, and tears down listeners on replay', () => {
  const e = environment()
  const stop = mountSmoothScroll()
  assert(e.root.classList.contains('lenis'))
  assert.equal(e.win.lenisVersion, '1.3.27')
  assert.equal(e.frames.size, 0)
  e.win.fire('wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, composedPath: () => [e.root, e.win], cancelable: true })
  assert.equal(e.frames.size, 1)
  e.win.fire('wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, composedPath: () => [e.root, e.win], cancelable: true })
  assert.equal(e.frames.size, 1)
  e.frame(); e.frame(33.34)
  assert(e.win.scrollY > 0)
  e.reduce(true)
  assert.equal(e.frames.size, 0)
  assert(!e.root.classList.contains('lenis'))
  stop(); assert.equal(e.listeners(), 0)
  e.reduce(false)
  const again = mountSmoothScroll()
  assert(e.root.classList.contains('lenis'))
  again(); assert.equal(e.listeners(), 0)
  assert(e.observers.every(observer => !observer.observed.size))
})

// Actual local Lenis constructor, native anchor semantics, and pending-work disposal.
test('Lenis preserves anchor URLs, focus and native skip links; pending work is disposed', () => {
  const e = environment()
  const oldTimeout = globalThis.setTimeout
  const oldClearTimeout = globalThis.clearTimeout
  globalThis.setTimeout = e.win.setTimeout
  globalThis.clearTimeout = e.win.clearTimeout
  try {
    const stop = mountSmoothScroll()
    const link = e.make(Element)
    link.href = 'https://example.com/portfolio/#about'
    e.hero.bounds.top = 1000
    const click = e.doc.fire('click', { button: 0, target: link })
    assert.equal(click.defaultPrevented, true)
    assert.equal(e.win.location.hash, '#about')
    assert.equal(e.frames.size, 1)
    for (let time = 16.67; e.frames.size && time < 8000; time += 16.67) e.frame(time)
    assert.equal(e.hero.focused, true)
    assert.equal(e.hero.getAttribute('tabindex'), '-1')
    // A same-target navigation queues Lenis completion frames; unmount cancels them.
    e.doc.fire('click', { button: 0, target: link })
    assert(e.frames.size > 0)
    // Interrupt as unmount would; no pending frame or focus mutation survives.
    e.win.fire('resize')
    assert(e.timers.size > 0)
    stop()
    assert.equal(e.timers.size, 0)
    assert.equal(e.frames.size, 0)
    assert.equal(e.hero.hasAttribute('tabindex'), false)
    assert.equal(e.listeners(), 0)
    const again = mountSmoothScroll()
    link.classList.add('skip-link')
    const skip = e.doc.fire('click', { button: 0, target: link })
    assert.equal(skip.defaultPrevented, undefined)
    again()
  } finally {
    globalThis.setTimeout = oldTimeout
    globalThis.clearTimeout = oldClearTimeout
  }
})

test('Orb releases the context on final unmount but not during Strict Mode replay', async () => {
  const e = environment()
  const canvas = e.make(Element)
  const { gl, counts } = gpu()
  canvas.getContext = () => gl
  let renderer = initHeroOrb(e.hero, canvas)
  e.observers.at(-1).emit(e.hero); e.frame()
  renderer.destroy()
  renderer = initHeroOrb(e.hero, canvas)
  e.observers.at(-1).emit(e.hero); e.frame()
  await Promise.resolve()
  assert.equal(counts.contextLosses, 0)
  assert.equal(counts.programs, 1)
  renderer.destroy()
  await Promise.resolve()
  assert.equal(counts.contextLosses, 1)
  assert.equal(counts.programs + counts.buffers + counts.arrays, 0)
  assert.equal(e.frames.size, 0)
  assert.equal(e.listeners(), 0)
})

test('Lenis uses native scrolling without ResizeObserver or fine-pointer input', () => {
  for (const missingObserver of [true, false]) {
    const e = environment()
    if (missingObserver) {
      delete e.win.ResizeObserver
      delete globalThis.ResizeObserver
    } else e.win.matchMedia('(hover: hover) and (pointer: fine)').matches = false
    const stop = mountSmoothScroll()
    assert(!e.root.classList.contains('lenis'))
    assert.equal(e.win.count(), 2) // Only the controller pagehide/pageshow handlers.
    assert.equal(e.frames.size, 0)
    stop()
    assert.equal(e.listeners(), 0)
  }
})
