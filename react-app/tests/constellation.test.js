import test from 'node:test'
import assert from 'node:assert/strict'
import { mountConstellation } from '../src/effects/constellation.js'
import { createConstellationData } from '../src/data/constellation3d.js'
import { createConstellationScene } from '../src/effects/constellationScene.js'
import { createHeroProgress } from '../src/effects/heroDissolve.js'

class Target extends EventTarget {
  handlers = new Set()
  addEventListener(type, fn, options) {
    super.addEventListener(type, fn, options)
    const key = { type, fn }
    this.handlers.add(key)
    options?.signal?.addEventListener('abort', () => this.handlers.delete(key), { once: true })
  }
  fire(type, properties = {}) {
    const event = new Event(type, { cancelable: true })
    Object.assign(event, properties)
    this.dispatchEvent(event)
    return event
  }
}
function environment({ deferred = false, fail = false, width = 1440, fine = true } = {}) {
  const win = new Target(), doc = new Target(), hero = new Target(), canvas = new Target()
  const frames = new Map(), observers = [], media = [], targets = [win, doc, hero, canvas]
  const classes = new Set()
  const progress = createHeroProgress()
  const size = { width, height: 815 }
  let pointerReads = 0
  let id = 0, created = 0, disposed = 0, rendered = 0, resized = 0, loaderCalls = 0, resolve
  const host = {
    parentElement: { classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name) } } },
    closest: () => hero,
    getBoundingClientRect: () => size,
  }
  hero.getBoundingClientRect = () => { pointerReads++; return { left: 0, top: 85, width, height: 815 } }
  win.navigator = { hardwareConcurrency: 8, deviceMemory: 8, connection: new Target() }
  targets.push(win.navigator.connection)
  win.matchMedia = query => {
    const result = new Target(); result.matches = query.includes('min-width') && width >= 901 && fine
    media.push(result); targets.push(result); return result
  }
  win.requestAnimationFrame = fn => { frames.set(++id, fn); return id }
  win.cancelAnimationFrame = key => frames.delete(key)
  win.devicePixelRatio = 3
  win.IntersectionObserver = win.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() { this.connected = true }
    disconnect() { this.connected = false }
    emit(value = true) { this.callback([{ isIntersecting: value }]) }
  }
  const api = { createConstellationScene() {
    created++
    if (fail) throw new Error('No WebGL')
    return { canvas, render(_time, pointer, value) { rendered++; api.pointer = { ...pointer }; api.progress = value },
      resize() { resized++ }, healthy: () => api.healthy,
      dispose() { disposed++ } }
  }, healthy: true }
  const loadScene = () => { loaderCalls++; return deferred ? new Promise(done => { resolve = done }) : Promise.resolve(api) }
  const flush = async () => { await Promise.resolve(); await Promise.resolve() }
  return { win, doc, hero, canvas, host, media, classes, observers, targets, api, frames, size,
    pointerReads: () => pointerReads,
    progress, mount: () => mountConstellation(host, { win, doc, loadScene, progress }), flush,
    resolve: () => resolve(api),
    async enter() { observers[0].emit(); await flush() },
    step(stamp = 100) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(stamp)) },
    stats: () => ({ created, disposed, rendered, resized, loaderCalls }),
    clean() {
      assert.equal(frames.size, 0)
      assert(observers.every(o => !o.connected))
      assert(targets.every(t => !t.handlers.size))
      assert(!classes.has('is-ready'))
    },
  }
}

test('seeded network stays nearby, non-spherical and stable with bounded degree', () => {
  const data = createConstellationData()
  assert.deepEqual(data, createConstellationData())
  assert.notDeepEqual(data, createConstellationData(3))
  assert.equal(data.nodes.length, 150)
  const degree = Array(150).fill(0), seen = new Set()
  for (const { position: [x, y, z] } of data.nodes) {
    assert(x >= -1.5 && x <= 7.75 && y >= -3.4 && y <= 3.8 && Math.abs(z) <= 1.3)
  }
  assert(data.nodes.filter(n => n.position[0] > 1 && n.position[0] < 6).length > 90)
  assert(data.edges.length > 100)
  for (const [a, b] of data.edges) {
    assert(a < b); assert(!seen.has(`${a}-${b}`)); seen.add(`${a}-${b}`)
    degree[a]++; degree[b]++
    assert(Math.hypot(...data.nodes[a].position.map((v, i) => v - data.nodes[b].position[i])) < 1.9)
  }
  assert(degree.every(value => value <= 3))
})

test('controller pauses, interpolates pointer, restores context and cleans up Strict Mode replay', async () => {
  const env = environment()
  for (let replay = 0; replay < 2; replay++) {
    const startObserver = env.observers.length
    const cleanup = env.mount()
    env.observers[startObserver].emit(); await env.flush()
    assert.equal(env.frames.size, 1)
    assert(!env.classes.has('is-ready'))
    env.step(); assert(env.classes.has('is-ready'))
    env.hero.fire('pointermove', { clientX: 1440, clientY: 900, pointerType: 'mouse' })
    env.step(150)
    assert(env.api.pointer.x > 0 && env.api.pointer.x < 1)
    env.hero.fire('pointerleave'); env.step(200)
    assert(env.api.pointer.x < .19)
    env.doc.hidden = true; env.doc.fire('visibilitychange'); assert.equal(env.frames.size, 0)
    env.doc.hidden = false; env.doc.fire('visibilitychange'); assert.equal(env.frames.size, 1)
    env.observers[startObserver].emit(false); assert.equal(env.frames.size, 0)
    env.observers[startObserver].emit(true); assert.equal(env.frames.size, 1)
    env.win.fire('pagehide'); assert.equal(env.frames.size, 0)
    env.win.fire('pageshow'); assert.equal(env.frames.size, 1)
    assert(env.canvas.fire('webglcontextlost').defaultPrevented)
    assert(!env.classes.has('is-ready')); assert.equal(env.frames.size, 0)
    env.canvas.fire('webglcontextrestored'); env.step(300)
    assert(env.classes.has('is-ready'))
    cleanup(); cleanup(); env.clean()
  }
  assert.equal(env.stats().created, 2); assert.equal(env.stats().disposed, 2)
})

test('fallback avoids GPU on constrained devices and handles runtime preference changes', async () => {
  for (const constraint of ['motion', 'mobile', 'contrast', 'saveData']) {
    const env = environment()
    const cleanup = env.mount()
    if (constraint === 'motion') env.media[0].matches = true
    if (constraint === 'mobile') env.media[1].matches = false
    if (constraint === 'contrast') env.media[2].matches = true
    if (constraint === 'saveData') env.win.navigator.connection.saveData = true
    await env.enter(); assert.equal(env.stats().loaderCalls, 0)
    cleanup(); env.clean()
  }
  const env = environment(), cleanup = env.mount()
  await env.enter(); env.step()
  env.media[0].matches = true; env.media[0].fire('change')
  assert.equal(env.stats().disposed, 1); assert(!env.classes.has('is-ready'))
  env.media[0].matches = false; env.media[0].fire('change'); await env.flush(); env.step(200)
  assert.equal(env.stats().created, 2)
  cleanup(); env.clean()
})

test('late imports, renderer failure and failed shader health keep static fallback without leaks', async () => {
  const pending = environment({ deferred: true }), cancelPending = pending.mount()
  pending.observers[0].emit(); pending.doc.fire('visibilitychange'); pending.observers[0].emit()
  assert.equal(pending.stats().loaderCalls, 1)
  pending.resolve(); await pending.flush(); assert.equal(pending.frames.size, 1)
  cancelPending(); pending.clean()
  const late = environment({ deferred: true }), cleanup = late.mount()
  late.observers[0].emit(); cleanup(); late.resolve(); await late.flush()
  assert.equal(late.stats().created, 0); late.clean()
  for (const fail of [true, false]) {
    const env = environment({ fail }), stop = env.mount()
    await env.enter(); env.api.healthy = false; env.step()
    assert(!env.classes.has('is-ready')); assert.equal(env.frames.size, 0)
    env.doc.fire('visibilitychange'); await env.flush()
    assert.equal(env.stats().created, 1)
    stop(); env.clean()
  }
})

test('batched scene caps DPR, keeps flow on live edges and disposes all GPU resources once', () => {
  let removed = 0, disposed = 0, lost = 0, renderedScene, camera, ratio
  const renderer = { domElement: { setAttribute() {}, remove() { removed++ } }, debug: {},
    setClearColor() {}, setPixelRatio(value) { ratio = value }, setSize() {},
    getContext: () => ({ isContextLost: () => false }),
    render(scene, cam) { renderedScene = scene; camera = cam },
    dispose() { disposed++ }, forceContextLoss() { lost++ } }
  const instance = createConstellationScene({ appendChild() {} }, { createRenderer: () => renderer })
  instance.resize(1440, 815, 3); assert.equal(ratio, 1.5)
  instance.render(3, { x: .5, y: .5 })
  const [nodes, lines, flows] = renderedScene.children[0].children
  assert.equal(nodes.geometry.attributes.position.count, 150)
  assert.equal(flows.geometry.attributes.position.count, 6)
  assert.equal(renderedScene.children[0].children.length, 3)
  assert.equal(camera.aspect, 1440 / 815)
  const positionsAtZero = Array.from(nodes.geometry.attributes.position.array)
  const linksAtZero = Array.from(lines.geometry.attributes.position.array)
  const lineVersion = lines.geometry.attributes.position.version
  const flowVersion = flows.geometry.attributes.position.version
  instance.render(3, { x: .5, y: .5 }, .8)
  assert.equal(lines.geometry.attributes.position.version, lineVersion)
  assert.equal(flows.geometry.attributes.position.version, flowVersion)
  const positionsAtDissolve = Array.from(nodes.geometry.attributes.position.array)
  assert.notDeepEqual(positionsAtDissolve, positionsAtZero)
  assert.equal(lines.visible, false)
  assert(nodes.material.uniforms.visibility.value < 1)
  assert.equal(flows.material.uniforms.visibility.value, 0)
  for (const value of [.3, .95, .6, .8, 1, 0, .8]) {
    instance.render(3, { x: .5, y: .5 }, value)
  }
  assert.deepEqual(Array.from(nodes.geometry.attributes.position.array), positionsAtDissolve)
  instance.render(3, { x: .5, y: .5 }, 1)
  assert.equal(nodes.material.uniforms.visibility.value, 0)
  instance.render(3, { x: .5, y: .5 }, 0)
  assert.deepEqual(Array.from(nodes.geometry.attributes.position.array), positionsAtZero)
  assert.deepEqual(Array.from(lines.geometry.attributes.position.array), linksAtZero)
  assert.equal(lines.material.opacity, .15); assert.equal(lines.visible, true)
  assert.equal(nodes.material.uniforms.visibility.value, 1)
  assert.equal(flows.material.uniforms.visibility.value, 1)
  instance.render(3, { x: .5, y: .5 }, .25)
  assert.deepEqual(Array.from(nodes.geometry.attributes.position.array), positionsAtZero)
  const data = createConstellationData()
  for (let i = 0; i < 6; i++) {
    const edgeIndex = Math.floor((i + .5) / 6 * data.edges.length)
    const progress = (3 / (12 + i * 1.7) + i / 6) % 1
    for (let axis = 0; axis < 3; axis++) {
      const attr = lines.geometry.attributes.position.array
      const expected = attr[edgeIndex * 6 + axis] * (1 - progress) + attr[edgeIndex * 6 + 3 + axis] * progress
      assert(Math.abs(flows.geometry.attributes.position.array[i * 3 + axis] - expected) < .00001)
    }
  }
  let released = 0
  for (const object of [nodes, lines, flows]) {
    object.geometry.addEventListener('dispose', () => released++)
    object.material.addEventListener('dispose', () => released++)
  }
  assert(instance.healthy()); renderer.debug.onShaderError(); assert(!instance.healthy())
  instance.dispose(); instance.dispose()
  assert.deepEqual([released, removed, disposed, lost], [6, 1, 1, 1])
  assert.throws(() => createConstellationScene({ appendChild() { throw new Error('host detached') } },
    { createRenderer: () => renderer }), /host detached/)
  assert.deepEqual([removed, disposed, lost], [2, 2, 2])
})

test('responsive eligibility covers target widths, fine input, forced colors and privacy-friendly device hints', async () => {
  for (const width of [1920, 1440, 1366, 1024, 768, 430, 390, 360, 320]) {
    const env = environment({ width }), cleanup = env.mount()
    env.win.navigator.deviceMemory = 2; env.win.navigator.hardwareConcurrency = 2
    await env.enter()
    assert.equal(env.stats().created, width >= 901 ? 1 : 0, `width ${width}`)
    cleanup(); env.clean()
  }
  const touch = environment({ width: 1024, fine: false }), stopTouch = touch.mount()
  await touch.enter(); assert.equal(touch.stats().loaderCalls, 0)
  stopTouch(); touch.clean()
  const env = environment(), cleanup = env.mount()
  await env.enter(); env.step()
  env.media[2].matches = true; env.media[2].fire('change')
  assert.equal(env.stats().disposed, 1); assert.equal(env.frames.size, 0)
  env.media[2].matches = false; env.media[2].fire('change'); await env.flush(); env.step(200)
  assert.equal(env.stats().created, 2)
  cleanup(); env.clean()
})

test('pointer layout reads coalesce; zero-size and orientation changes pause or remeasure without loops', async () => {
  const env = environment(), cleanup = env.mount()
  await env.enter(); env.step()
  for (let i = 0; i < 30; i++) env.hero.fire('pointermove', { pointerType: 'mouse', clientX: 1000 + i, clientY: 300 })
  assert.equal(env.pointerReads(), 0)
  env.step(150); assert.equal(env.pointerReads(), 1)
  env.step(200); assert.equal(env.pointerReads(), 1)
  env.size.width = 0; env.observers[1].emit(); env.step(250)
  assert.equal(env.frames.size, 0)
  env.size.width = 1440; env.observers[1].emit(); assert.equal(env.frames.size, 1)
  const resized = env.stats().resized
  env.step(300); assert.equal(env.stats().resized, resized + 1)
  env.win.fire('orientationchange'); env.step(350)
  assert.equal(env.stats().resized, resized + 2)
  cleanup(); env.clean()
})

test('dissolved controller sleeps and resumes with latest progress after offscreen, context and preference pauses', async () => {
  const env = environment(), cleanup = env.mount()
  await env.enter(); env.step()
  env.progress.set(1)
  assert.equal(env.frames.size, 0)
  const rendered = env.stats().rendered
  env.step(200); assert.equal(env.stats().rendered, rendered)
  env.progress.set(.7); assert.equal(env.frames.size, 1)
  env.step(250); assert.equal(env.api.progress, .7)
  env.observers[0].emit(false); env.progress.set(.4)
  assert.equal(env.frames.size, 0)
  env.observers[0].emit(true); env.step(300); assert.equal(env.api.progress, .4)
  env.canvas.fire('webglcontextlost'); env.progress.set(.8)
  assert.equal(env.frames.size, 0)
  env.canvas.fire('webglcontextrestored'); env.step(350); assert.equal(env.api.progress, .8)
  env.media[0].matches = true; env.media[0].fire('change'); env.progress.set(.35)
  assert.equal(env.frames.size, 0)
  env.media[0].matches = false; env.media[0].fire('change'); await env.flush()
  env.step(400); assert.equal(env.api.progress, .35)
  cleanup(); env.progress.set(.1); env.clean()
  const initial = environment(); initial.progress.set(1)
  const stop = initial.mount(); await initial.enter()
  assert.equal(initial.stats().loaderCalls, 0)
  initial.progress.set(.5); await initial.flush(); initial.step()
  assert.equal(initial.api.progress, .5)
  stop(); initial.clean()
})
