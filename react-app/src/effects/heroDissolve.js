export const clampProgress = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
export function dissolveEase(start, end, progress) {
  const t = clampProgress((progress - start) / (end - start))
  return t * t * (3 - 2 * t)
}

// A mount-local scalar shared by the scroll controller and renderer, outside React.
export function createHeroProgress() {
  let value = 0
  const listeners = new Set()
  return {
    get value() { return value },
    set(next) {
      next = clampProgress(next)
      if (next === value) return
      value = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  }
}

export function heroScrollProgress(scrollY, start, end) {
  return clampProgress((scrollY - start) / Math.max(1, end - start))
}

export function mountHeroDissolve(hero, progress, { win = window, doc = document } = {}) {
  if (!hero) return () => {}
  const header = doc.querySelector('.site-header')
  const next = hero.nextElementSibling
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)')
  const rootStyle = doc.documentElement?.style
  const previousHeader = rootStyle?.getPropertyValue('--lab-sticky-header-height') || ''
  const previousPriority = rootStyle?.getPropertyPriority('--lab-sticky-header-height') || ''
  const events = new AbortController()
  let frame = 0, dirty = true, disposed = false, pageActive = true, start = 0, end = 1, applied = -1
  let measuredHeader = -1
  const properties = ['--lab-content-opacity', '--lab-content-shift', '--lab-scene-opacity']
  const reset = () => { for (const key of properties) hero.style.removeProperty(key) }
  const cancel = () => { win.cancelAnimationFrame(frame); frame = 0 }
  const update = () => {
    frame = 0
    if (disposed) return
    if (!pageActive || doc.hidden) return
    if (dirty) {
      // Read all layout before writing styles; scroll frames use cached bounds.
      const bounds = hero.getBoundingClientRect()
      const headerHeight = header?.getBoundingClientRect().height || 0
      start = bounds.top + win.scrollY - headerHeight
      end = (next?.getBoundingClientRect().top ?? bounds.bottom) + win.scrollY - headerHeight
      dirty = false
      if (headerHeight !== measuredHeader) {
        measuredHeader = headerHeight
        rootStyle?.setProperty('--lab-sticky-header-height', `${headerHeight}px`)
      }
    }
    if (motion.matches) { progress.set(0); reset(); applied = -1; return }
    const value = heroScrollProgress(win.scrollY, start, end)
    if (value === applied) return
    applied = value
    const fade = dissolveEase(.55, .95, value)
    hero.style.setProperty('--lab-content-opacity', String(1 - fade))
    hero.style.setProperty('--lab-content-shift', `${-16 * fade}px`)
    hero.style.setProperty('--lab-scene-opacity', String(1 - dissolveEase(.55, 1, value)))
    progress.set(value)
  }
  const request = () => {
    if (!disposed && pageActive && !doc.hidden && !frame) frame = win.requestAnimationFrame(update)
  }
  const measure = () => { dirty = true; request() }
  const on = (target, type, listener) => target?.addEventListener(type, listener, { signal: events.signal, passive: true })
  on(win, 'scroll', request)
  // Lenis emits after its native position write. Consume it in the same frame and
  // cancel any queued native-scroll update rather than running two scroll loops.
  on(win, 'portfolio:smooth-scroll', () => { cancel(); update() })
  on(win, 'resize', measure)
  on(win, 'orientationchange', measure)
  on(motion, 'change', () => { cancel(); update() })
  on(doc, 'visibilitychange', () => { cancel(); measure() })
  on(win, 'pagehide', () => { pageActive = false; cancel() })
  on(win, 'pageshow', () => { pageActive = true; measure() })
  on(doc.fonts, 'loadingdone', measure)
  doc.fonts?.ready?.then(() => { if (!disposed) measure() })
  const observer = win.ResizeObserver ? new win.ResizeObserver(measure) : null
  for (const element of [hero, header, next]) if (element) observer?.observe(element)
  update() // Correct immediately on a restored scroll position or anchor reload.
  return () => {
    disposed = true; cancel(); events.abort(); observer?.disconnect(); reset(); progress.set(0)
    if (previousHeader) rootStyle?.setProperty('--lab-sticky-header-height', previousHeader, previousPriority)
    else rootStyle?.removeProperty('--lab-sticky-header-height')
  }
}
