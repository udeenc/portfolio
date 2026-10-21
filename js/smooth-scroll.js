/* Lenis 1.3.27 (MIT): local dependency, native flow, no idle animation loop. */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  let instance = null;
  let controller = null;
  let frame = 0;
  let lastFrameTime = 0;
  let animationTime = 0;
  let pageActive = true;
  let pendingTarget = null;
  let targetDirty = false;
  let layoutObserver = null;

  function wake() {
    if (!frame && instance && !document.hidden && pageActive) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function tick(time) {
    frame = 0;
    if (!instance) return;
    try {
      if (pendingTarget && targetDirty) scrollToTarget();
      // Exclude idle time so the first wheel input after a pause never jumps.
      animationTime += lastFrameTime ? time - lastFrameTime : 1000 / 60;
      lastFrameTime = time;
      instance.raf(animationTime);
      window.dispatchEvent(new Event('portfolio:smooth-scroll'));
      if (instance.isScrolling === 'smooth') wake();
      else lastFrameTime = 0;
    } catch (error) {
      destroy();
      console.warn('Smooth scrolling stopped; native scrolling remains available.', error);
    }
  }

  function destroy() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrameTime = 0;
    animationTime = 0;
    controller?.abort();
    controller = null;
    instance?.destroy();
    instance = null;
    layoutObserver?.disconnect();
    layoutObserver = null;
    // Complete navigation natively if tab hiding or a fallback interrupts it.
    if (pendingTarget) {
      const target = pendingTarget;
      pendingTarget = null;
      window.scrollTo({ top: destinationFor(target), behavior: 'instant' });
      if (!document.hidden) focusTarget(target);
    }
  }

  function cancelMomentum() {
    pendingTarget = null;
    if (!instance) return;
    // Synchronous stop/start clears inertia without consuming the native input.
    instance.stop();
    instance.start();
    window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrameTime = 0;
  }

  function focusTarget(target) {
    const temporary = !target.hasAttribute('tabindex');
    if (temporary) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (temporary) {
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  }

  function destinationFor(target) {
    const offset = Math.max(
      Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0,
      (header?.getBoundingClientRect().height || 0) + 16
    );
    return target.getBoundingClientRect().top + window.scrollY - offset;
  }

  function scrollToTarget() {
    targetDirty = false;
    const target = pendingTarget;
    if (!target || !instance) return;
    instance.resize();
    instance.scrollTo(destinationFor(target), { onComplete: () => {
      if (pendingTarget !== target) return;
      pendingTarget = null;
      focusTarget(target);
    } });
  }

  function onAnchor(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.search !== window.location.search || !url.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
    catch { return; }
    if (!target) return;
    cancelMomentum();
    // The skip link keeps its native navigation and focus semantics.
    if (link.classList.contains('skip-link')) return;
    // Preserve the URL and browser history without triggering a second scroll.
    if (window.location.hash !== url.hash) window.history.pushState(window.history.state, '', url.hash);
    event.preventDefault();
    pendingTarget = target;
    scrollToTarget();
    wake();
  }

  function sync() {
    const enabled = pageActive && !document.hidden && !motion.matches && mouse.matches && typeof window.Lenis === 'function';
    if (!enabled) { destroy(); return; }
    if (instance) return;
    try {
      instance = new window.Lenis({
        autoRaf: false,
        lerp: .12,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        allowNestedScroll: true,
        respectReducedMotion: true
      });
      instance.on('virtual-scroll', ({ event }) => {
        if (event.type === 'wheel') { pendingTarget = null; wake(); }
      });
      if ('ResizeObserver' in window) {
        layoutObserver = new ResizeObserver(() => {
          if (pendingTarget) { targetDirty = true; wake(); }
        });
        layoutObserver.observe(document.body);
        if (header) layoutObserver.observe(header);
      }
      controller = new AbortController();
      const options = { signal: controller.signal };
      document.addEventListener('click', onAnchor, options);
      document.addEventListener('keydown', event => {
        if (['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) cancelMomentum();
      }, options);
      document.addEventListener('pointerdown', cancelMomentum, { ...options, passive: true });
      window.addEventListener('popstate', cancelMomentum, options);
      window.addEventListener('hashchange', cancelMomentum, options);
    } catch (error) {
      destroy();
      console.warn('Smooth scrolling unavailable; using native scrolling.', error);
    }
  }

  motion.addEventListener('change', sync);
  mouse.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { pageActive = false; destroy(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(); });
  sync();
})();
