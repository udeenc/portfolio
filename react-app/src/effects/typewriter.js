import { createLifecycle } from './lifecycle.js'

export const greetings = [
  'Curious about what I build?',
  "There's a story behind every project.",
  'Scroll down and take a look.',
]

// Timings and phase transitions follow the approved vanilla implementation.
export function mountTypewriter(hero, render) {
  const { on, dispose } = createLifecycle()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let index = 0
  let character = 0
  let timer = 0
  let phase = 'typing'
  let inView = false
  let pageActive = true
  let ready = false
  let disposed = false
  let view = { text: greetings[0], typing: false, changing: false }

  function update(patch) {
    if (disposed) return
    view = { ...view, ...patch }
    render(view)
  }

  function stop() {
    window.clearTimeout(timer)
    timer = 0
    update({ typing: false })
  }

  function schedule(delay) {
    timer = window.setTimeout(step, delay)
  }

  function step() {
    timer = 0
    if (disposed || document.hidden || !inView || !pageActive || motion.matches) return
    if (phase === 'holding') {
      update({ changing: true })
      phase = 'changing'
      schedule(180)
    } else if (phase === 'changing') {
      index = (index + 1) % greetings.length
      character = 0
      update({ text: '', changing: false })
      phase = 'typing'
      schedule(55)
    } else {
      character += 1
      update({ text: greetings[index].slice(0, character) })
      if (character === greetings[index].length) {
        phase = 'holding'
        schedule(2000)
      } else schedule(55)
    }
  }

  function sync() {
    stop()
    if (motion.matches) {
      index = character = 0
      phase = 'typing'
      ready = false
      update({ text: greetings[0], changing: false })
      return
    }
    if (document.hidden || !inView || !pageActive) return
    update({ typing: true })
    if (!ready) {
      ready = true
      update({ text: '' })
      schedule(800)
    } else schedule(phase === 'holding' ? 2000 : phase === 'changing' ? 180 : 55)
  }

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (disposed) return
    inView = entries[0].isIntersecting
    sync()
  }) : null
  if (observer) observer.observe(hero)
  else inView = true
  on(motion, 'change', sync)
  on(document, 'visibilitychange', sync)
  on(window, 'pagehide', () => { pageActive = false; stop(); observer?.disconnect() })
  on(window, 'pageshow', () => { pageActive = true; observer?.observe(hero); sync() })
  sync()

  return () => {
    disposed = true
    window.clearTimeout(timer)
    observer?.disconnect()
    dispose()
  }
}
