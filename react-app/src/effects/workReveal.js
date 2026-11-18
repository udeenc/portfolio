import { createLifecycle } from './lifecycle.js'

// Fail open: default content is visible, and animation is only added on entry.
export function mountWorkReveal(section, { win = window } = {}) {
  if (!section || !win.IntersectionObserver) return () => {}
  const { on, dispose } = createLifecycle()
  const elements = [...section.querySelectorAll('[data-work-reveal]')]
  const remaining = new Set(elements)
  let observer, disposed = false
  const clear = () => elements.forEach(element => element.classList.remove('is-work-revealed'))
  const cleanup = () => { disposed = true; dispose(); observer?.disconnect(); clear() }
  try {
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)')
    const reveal = (element, animate = true) => {
      if (!remaining.delete(element)) return
      if (animate) element.classList.add('is-work-revealed')
      observer.unobserve(element)
      if (!remaining.size) observer.disconnect()
    }
    observer = new win.IntersectionObserver(entries => {
      if (disposed || motion.matches) return
      for (const entry of entries) if (entry.isIntersecting) reveal(entry.target)
    }, { threshold: .04 })
    const sync = () => {
      observer.disconnect()
      if (motion.matches) { remaining.clear(); clear() }
      else for (const element of remaining) observer.observe(element)
    }
    on(motion, 'change', sync)
    on(section, 'focusin', event => {
      const element = event.target.closest('[data-work-reveal]')
      if (element && elements.includes(element)) {
        element.classList.remove('is-work-revealed'); reveal(element, false)
      }
    })
    sync()
  } catch { cleanup() }
  return cleanup
}
