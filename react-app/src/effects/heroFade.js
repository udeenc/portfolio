import { createLifecycle } from './lifecycle.js'

export function mountHeroFade(hero) {
  const { on, dispose } = createLifecycle()

  if (!hero) return;
  const header = document.querySelector('.site-header');
  const overlap = document.querySelector('.about-overlap');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let top = 0;
  let distance = 1;
  let headerHeight = 0;
  let measure = true;
  let active = true;

  function cancel() {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function update() {
    frame = 0;
    if (motion.matches || document.hidden || !active) return;
    if (measure) {
      const bounds = hero.getBoundingClientRect();
      top = Math.max(0, bounds.top + window.scrollY - headerHeight);
      // Finish as About reaches the header; use native scroll positions in both directions.
      const aboutTop = (overlap?.getBoundingClientRect().top ?? bounds.bottom) + window.scrollY;
      distance = Math.max(aboutTop - headerHeight - top, 1);
      measure = false;
    }
    const progress = Math.min(1, Math.max(0, (window.scrollY - top) / distance));
    const eased = progress * progress * (3 - 2 * progress);
    hero.style.setProperty('--hero-opacity', String(1 - eased));
  }

  function requestUpdate() {
    if (!frame && active && !motion.matches && !document.hidden) {
      frame = window.requestAnimationFrame(update);
    }
  }

  function resize() {
    measure = true;
    if (document.hidden || !active) return;
    const height = header?.getBoundingClientRect().height || 0;
    if (height !== headerHeight) {
      headerHeight = height;
      hero.style.setProperty('--hero-header-height', `${height}px`);
    }
    requestUpdate();
  }

  function sync() {
    cancel();
    if (motion.matches) hero.style.removeProperty('--hero-opacity');
    resize();
  }

  const observer = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  observer?.observe(hero);
  if (header) observer?.observe(header);
  on(window, 'scroll', requestUpdate, { passive: true });
  // Lenis notifies after writing the actual native scroll position in its frame.
  on(window, 'portfolio:smooth-scroll', () => { cancel(); update(); });
  on(window, 'resize', resize, { passive: true });
  on(motion, 'change', sync);
  on(document, 'visibilitychange', sync);
  on(window, 'pagehide', () => { active = false; cancel(); observer?.disconnect(); });
  on(window, 'pageshow', () => { active = true; observer?.observe(hero); if (header) observer?.observe(header); sync(); });
  on(document.fonts, 'loadingdone', resize);
  document.fonts?.ready.then(() => { if (active) resize(); });
  sync();
  return () => {
    dispose()
    active = false;
    cancel();
    observer?.disconnect();
    hero.style.removeProperty('--hero-opacity');
    hero.style.removeProperty('--hero-header-height');
  }
}
