import test from 'node:test'
import assert from 'node:assert/strict'
import { createGalleryState, galleryReducer, watchGalleryMotion } from '../src/effects/galleryState.js'
import { mountWorkReveal } from '../src/effects/workReveal.js'

const select = (state, index) => galleryReducer(state, { type: 'select', index })
const ready = state => galleryReducer(state, { type: 'ready', index: state.pending, version: state.version })

test('shared pipeline/Olist gallery defaults to first image, preserves display until load, and navigates both ways', () => {
  for (const gallery of ['Pipeline', 'Olist']) {
    let state = createGalleryState(3)
    assert.deepEqual([state.current, state.requested, state.pending], [0, 0, null], gallery)
    state = select(state, 1)
    assert.deepEqual([state.current, state.requested, state.pending], [0, 1, 1])
    state = ready(state)
    assert.deepEqual([state.current, state.previous, state.pending], [1, 0, null])
    state = galleryReducer(state, { type: 'finish', index: 1, version: state.version })
    assert.equal(state.previous, null)
    state = ready(select(state, 2)); assert.equal(state.current, 2)
    state = ready(select(state, 0)); assert.equal(state.current, 0)
    assert.equal(select(state, 0), state)
    assert.equal(select(state, -1), state)
    assert.equal(select(state, 3), state)
  }
})

test('rapid gallery changes ignore stale loads/errors/fade events, including repeated selection of the same image', () => {
  let state = select(createGalleryState(3), 1)
  const first = { index: 1, version: state.version }
  assert.equal(select(state, 1), state)
  state = select(state, 2)
  assert.equal(galleryReducer(state, { type: 'ready', ...first }), state)
  assert.equal(galleryReducer(state, { type: 'failed', ...first }), state)
  state = ready(state)
  assert.equal(state.current, 2)
  const staleFade = { type: 'finish', index: 2, version: state.version }
  state = select(state, 1)
  const earlierOne = { type: 'ready', index: 1, version: state.version }
  state = select(state, 0)
  state = select(state, 1)
  assert.equal(galleryReducer(state, earlierOne), state)
  assert.equal(galleryReducer(state, staleFade), state)
  assert.equal(state.current, 2)
  state = ready(state)
  assert.equal(state.current, 1); assert.equal(state.previous, 2)
  state = select(state, 1)
  assert.equal(state.current, 1)
})

test('failed gallery load retains the working image and permits a fresh explicit retry', () => {
  let state = select(createGalleryState(3), 2)
  state = galleryReducer(state, { type: 'failed', index: 2, version: state.version })
  assert.deepEqual([state.current, state.requested, state.pending, state.error], [0, 0, null, 2])
  state = select(state, 2)
  assert.equal(state.error, null)
  state = ready(state)
  assert.equal(state.current, 2)
  state = select(state, 1)
  state = select(state, 2) // Returning to the visible image cancels outstanding work.
  assert.equal(state.pending, null); assert.equal(state.previous, null)
})

class Target extends EventTarget {
  listeners = new Map()
  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options)
    this.listeners.set(listener, type)
    options?.signal?.addEventListener('abort', () => this.listeners.delete(listener), { once: true })
  }
  removeEventListener(type, listener, options) {
    super.removeEventListener(type, listener, options); this.listeners.delete(listener)
  }
  fire(type, properties = {}) {
    const event = new Event(type)
    for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value })
    this.dispatchEvent(event)
  }
}

test('live reduced-motion changes remove gallery fade buffers and preference subscription cleans up on replay', () => {
  const media = new Target()
  media.matches = true
  let state = createGalleryState(3)
  for (let replay = 0; replay < 2; replay++) {
    const stop = watchGalleryMotion(reduced => { state = galleryReducer(state, { type: 'motion', reduced }) },
      { matchMedia: () => media })
    state = ready(select(state, 1)); assert.equal(state.previous, null)
    media.matches = false; media.fire('change')
    state = ready(select(state, 2)); assert.equal(state.previous, 1)
    media.matches = true; media.fire('change'); assert.equal(state.previous, null)
    assert.equal(state.current, 2)
    stop(); assert.equal(media.listeners.size, 0)
    state = createGalleryState(3)
  }
})

function revealEnvironment({ reduced = false, failure } = {}) {
  const media = new Target(), section = new Target(), observers = []
  media.matches = reduced
  const elements = Array.from({ length: 5 }, () => {
    const classes = new Set()
    const element = { classes, adds: 0 }
    element.classList = {
      add(name) { classes.add(name); element.adds++ },
      remove: name => classes.delete(name),
    }
    return element
  })
  section.querySelectorAll = () => elements
  const win = { matchMedia: () => media,
    requestAnimationFrame() { throw new Error('Reveal must not schedule a RAF loop') },
    IntersectionObserver: class {
      observed = new Set()
      constructor(callback) {
        if (failure === 'constructor') throw new Error('No observer')
        this.callback = callback; observers.push(this)
      }
      observe(element) { if (failure === 'observe') throw new Error('Cannot observe'); this.observed.add(element) }
      unobserve(element) { this.observed.delete(element) }
      disconnect() { this.observed.clear() }
      emit(element, isIntersecting = true) { this.callback([{ target: element, isIntersecting }]) }
    },
  }
  return { win, media, section, observers, elements,
    mount: () => mountWorkReveal(section, { win }),
    clean() {
      assert.equal(media.listeners.size, 0); assert.equal(section.listeners.size, 0)
      assert(observers.every(observer => observer.observed.size === 0))
      assert(elements.every(element => element.classes.size === 0))
    },
  }
}

test('Selected Work reveal runs once, skips focused content, and cleans up Strict Mode replay', () => {
  const env = revealEnvironment()
  for (let replay = 0; replay < 2; replay++) {
    const stop = env.mount(), observer = env.observers.at(-1), element = env.elements[0]
    assert.equal(observer.observed.size, 5)
    observer.emit(element, false); assert.equal(element.classes.size, 0)
    const adds = element.adds
    observer.emit(element); observer.emit(element)
    assert.equal(element.adds, adds + 1)
    assert.equal(observer.observed.size, 4)
    const focused = env.elements[3]
    env.section.fire('focusin', { target: { closest: () => focused } })
    observer.emit(focused)
    assert.equal(focused.classes.size, 0)
    for (const remaining of env.elements) observer.emit(remaining)
    assert.equal(observer.observed.size, 0)
    stop(); stop(); env.clean()
  }
})

test('Selected Work reveal is fail-open without observers, on setup failure, and under reduced motion', () => {
  for (const failure of ['constructor', 'observe', 'missing']) {
    const env = revealEnvironment({ failure })
    if (failure === 'missing') delete env.win.IntersectionObserver
    const stop = env.mount(); stop(); env.clean()
  }
  for (const reduced of [false, true]) {
    const env = revealEnvironment({ reduced }), stop = env.mount(), observer = env.observers[0]
    if (!reduced) observer.emit(env.elements[0])
    env.media.matches = true; env.media.fire('change')
    assert(env.elements.every(element => element.classes.size === 0))
    assert.equal(observer.observed.size, 0)
    env.media.matches = false; env.media.fire('change')
    assert.equal(observer.observed.size, 0) // No replay after reduced-motion fallback.
    stop(); env.clean()
  }
})
