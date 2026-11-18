import { constellationConfig } from '../data/constellation3d.js'
import { createHeroProgress } from './heroDissolve.js'

// This controller owns only its empty canvas host, never React's content.
export function mountConstellation(host, {
  win = window, doc = document,
  loadScene = () => import('./constellationScene.js'),
  progress = createHeroProgress(),
} = {}) {
  if (!host || !win.IntersectionObserver || !win.ResizeObserver) return () => {}
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)')
  const desktop = win.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)')
  const contrast = win.matchMedia('(forced-colors: active)')
  const events = new AbortController()
  const hero = host.closest('section')
  let disposed = false, failed = false, visible = false, pageActive = true, lost = false
  let scene, canvasEvents, pending = false, frame = 0, last = null, time = 0, dirty = true, isReady = false
  let pointerDirty = false, clientX = 0, clientY = 0
  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  const capable = () => desktop.matches && !motion.matches && !contrast.matches && !win.navigator?.connection?.saveData
  const active = () => !disposed && !failed && capable() && visible && pageActive && !doc.hidden && !lost && progress.value < 1
  const ready = value => {
    if (isReady === value) return
    isReady = value; host.parentElement.classList.toggle('is-ready', value)
  }
  const neutral = () => { target.x = target.y = 0; pointerDirty = false }
  const stop = () => { win.cancelAnimationFrame(frame); frame = 0; last = null; neutral() }
  const release = () => {
    stop(); ready(false); canvasEvents?.abort(); canvasEvents = null
    scene?.dispose(); scene = null; lost = false
  }
  const fail = () => { failed = true; release() }
  const tick = stamp => {
    frame = 0
    if (!active() || !scene) return
    if (last !== null && stamp - last < 1000 / constellationConfig.fps) { schedule(); return }
    const delta = last === null ? 0 : Math.min((stamp - last) / 1000, .1)
    last = stamp; time += delta
    try {
      // Coalesce pointer events into a single layout read per rendered frame.
      // Read before renderer.resize writes the canvas dimensions.
      if (pointerDirty) {
        const box = hero.getBoundingClientRect()
        target.x = Math.max(-1, Math.min(1, (clientX - box.left) / Math.max(1, box.width) * 2 - 1))
        target.y = Math.max(-1, Math.min(1, (clientY - box.top) / Math.max(1, box.height) * 2 - 1))
        pointerDirty = false
      }
      const blend = 1 - Math.exp(-delta * 4)
      pointer.x += (target.x - pointer.x) * blend
      pointer.y += (target.y - pointer.y) * blend
      if (dirty) {
        const box = host.getBoundingClientRect()
        if (!box.width || !box.height) { stop(); return }
        scene.resize(box.width, box.height, win.devicePixelRatio || 1); dirty = false
      }
      scene.render(time, pointer, progress.value)
      if (lost) return
      // Shader/link failure must retain the SVG too, not just thrown exceptions.
      if (!scene.healthy()) { fail(); return }
      ready(true)
    } catch { fail(); return }
    schedule()
  }
  function schedule() { if (!frame && active() && scene) frame = win.requestAnimationFrame(tick) }
  async function sync() {
    if (disposed) return
    if (!capable()) { release(); return }
    if (!active()) { stop(); return }
    if (scene) { schedule(); return }
    if (pending || failed) return
    pending = true
    try {
      const { createConstellationScene } = await loadScene()
      if (!active()) return
      scene = createConstellationScene(host)
      canvasEvents = new AbortController()
      scene.canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); lost = true; stop(); ready(false)
      }, { signal: canvasEvents.signal })
      scene.canvas.addEventListener('webglcontextrestored', () => {
        lost = false; dirty = true; sync()
      }, { signal: canvasEvents.signal })
      dirty = true; schedule()
    } catch { if (!disposed) fail() }
    finally { pending = false }
  }
  const on = (targetElement, type, handler) => targetElement.addEventListener(type, handler, { signal: events.signal, passive: true })
  on(motion, 'change', sync); on(desktop, 'change', sync)
  on(contrast, 'change', sync)
  if (win.navigator?.connection) on(win.navigator.connection, 'change', sync)
  on(doc, 'visibilitychange', sync)
  on(win, 'pagehide', () => { pageActive = false; sync() })
  on(win, 'pageshow', () => { pageActive = true; sync() })
  on(win, 'blur', neutral)
  on(win, 'resize', () => { dirty = true })
  on(win, 'orientationchange', () => { dirty = true; sync() })
  on(hero, 'pointerleave', neutral)
  on(hero, 'pointermove', event => {
    if (!active() || event.pointerType === 'touch') return
    clientX = event.clientX; clientY = event.clientY; pointerDirty = true
  })
  const intersection = new win.IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting); sync()
  })
  const resize = new win.ResizeObserver(() => { dirty = true; sync() })
  const unsubscribe = progress.subscribe(sync)
  intersection.observe(hero); resize.observe(host)
  return () => {
    disposed = true; unsubscribe(); events.abort(); intersection.disconnect(); resize.disconnect(); release()
  }
}
