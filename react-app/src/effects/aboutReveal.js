import { createLifecycle } from './lifecycle.js'

export function mountAboutReveal(about) {
  if (!about || !('IntersectionObserver' in window)) return
  const { on, dispose } = createLifecycle()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const elements = [...about.querySelectorAll('[data-about-reveal]')]
  const remaining = new Set(elements)
  let disposed = false
  const observer = new IntersectionObserver(entries => {
    if (disposed || motion.matches) return
    for (const entry of entries) {
      if (entry.isIntersecting && remaining.has(entry.target)) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
        remaining.delete(entry.target)
      }
    }
    if (!remaining.size) observer.disconnect()
  }, { threshold: .1 })

  function sync() {
    observer.disconnect()
    if (motion.matches) {
      // Content is always visible; do not replay reveals after motion is reduced.
      remaining.clear()
      elements.forEach(element => element.classList.remove('is-revealed'))
    } else remaining.forEach(element => observer.observe(element))
  }
  on(motion, 'change', sync)
  sync()
  return () => {
    disposed = true
    dispose()
    observer.disconnect()
    elements.forEach(element => element.classList.remove('is-revealed'))
  }
}
