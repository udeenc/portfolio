export const navigationLinks = [
  { id: 'about', label: 'About' },
  { id: 'featured', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

// Cached geometry is refreshed only on layout changes. Native scrolling and
// Lenis both use the actual scroll position; callbacks run only on transitions.
export function mountHeaderNavigation(header, onActive, onScrolled, { win = window, doc = document } = {}) {
  const events = new AbortController()
  let disposed = false, positions = [], clearance = 100, height = 0
  let active, scrolled
  const update = () => {
    if (disposed) return
    const y = Math.max(0, win.scrollY)
    let next = null
    for (const section of positions) if (section.top <= y + clearance + 1) next = section.id
    // The closing section may be shorter than a viewport and cannot reach the
    // activation line. Select it at the document end, including after End/anchors.
    if (y > 0 && y + win.innerHeight >= height - 2) next = positions.at(-1)?.id ?? next
    // A small reverse tolerance prevents subpixel boundary jitter. Forward
    // activation stays exact so existing offset anchor destinations activate.
    const currentIndex = positions.findIndex(section => section.id === active)
    const nextIndex = positions.findIndex(section => section.id === next)
    if (currentIndex >= 0 && nextIndex < currentIndex && y + clearance + 1 >= positions[currentIndex].top - 6) next = active
    if (next !== active) { active = next; onActive(next) }
    const surface = scrolled ? y > 12 : y > 24
    if (surface !== scrolled) { scrolled = surface; onScrolled(surface) }
  }
  const measure = () => {
    if (disposed) return
    clearance = Math.max(100, (header?.getBoundingClientRect().height || 0) + 16,
      Number.parseFloat(win.getComputedStyle(doc.documentElement).scrollPaddingTop) || 0)
    positions = navigationLinks.flatMap(({ id }) => {
      const element = doc.getElementById(id)
      return element ? [{ id, top: element.getBoundingClientRect().top + win.scrollY }] : []
    })
    height = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)
    update()
  }
  const on = (target, type, handler) => target?.addEventListener(type, handler, { signal: events.signal, passive: true })
  for (const type of ['scroll', 'portfolio:smooth-scroll', 'hashchange', 'popstate']) on(win, type, update)
  for (const type of ['resize', 'orientationchange', 'pageshow']) on(win, type, measure)
  on(doc.fonts, 'loadingdone', measure)
  const observer = win.ResizeObserver ? new win.ResizeObserver(measure) : null
  // Observe section sizes as well as the body: redistribution can move a section
  // without changing total page height (font swaps, gallery/media layout).
  for (const element of [header, doc.body, ...navigationLinks.map(({ id }) => doc.getElementById(id))]) {
    if (element) observer?.observe(element)
  }
  doc.fonts?.ready?.then(() => { if (!disposed) measure() })
  measure()
  return () => { disposed = true; events.abort(); observer?.disconnect() }
}

// Disclosure navigation, not an ARIA menu or modal. Native Tab/Shift+Tab remain
// free to leave it. React owns expanded state/classes; this owns event cleanup.
export function mountHeaderMenu(toggle, menu, onOpenChange, { win = window, doc = document } = {}) {
  const viewport = win.matchMedia('(max-width: 800px)')
  const events = new AbortController()
  let open = false
  const setOpen = value => { if (open !== value) { open = value; onOpenChange(value) } }
  const close = () => setOpen(false)
  const on = (target, type, handler) => target.addEventListener(type, handler, { signal: events.signal })
  on(toggle, 'click', () => { if (viewport.matches) setOpen(!open) })
  on(menu, 'click', event => { if (event.target.closest?.('a[href]')) close() })
  on(doc, 'keydown', event => {
    if (event.key === 'Escape' && open) { close(); toggle.focus() }
  })
  on(doc, 'focusin', event => {
    if (open && !menu.contains(event.target) && !toggle.contains(event.target)) close()
  })
  on(doc, 'pointerdown', event => {
    if (open && !menu.contains(event.target) && !toggle.contains(event.target)) close()
  })
  on(viewport, 'change', () => {
    // Don't leave focus in links that become hidden, or in the desktop-hidden toggle.
    if (viewport.matches && menu.contains(doc.activeElement)) toggle.focus()
    else if (!viewport.matches && doc.activeElement === toggle) menu.querySelector('a')?.focus()
    close()
  })
  return () => events.abort()
}
