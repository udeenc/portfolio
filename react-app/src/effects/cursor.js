import { createLifecycle } from './lifecycle.js'

export function mountCursor(cursor) {
  const { on, dispose } = createLifecycle()

  if (!cursor) return;
  const capability = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const interactive = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [role="button"], [data-cursor="interactive"], .featured-card, .project-card, .carousel-control';
  let controller;
  let visible = false;
  let x = 0;
  let y = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let lastTime = 0;

  function render() {
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
  }

  function stop() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function animate(time) {
    const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16.67;
    lastTime = time;
    // Equivalent to a .25 lerp at 60 Hz, independent of refresh rate.
    const amount = 1 - Math.pow(1 - .25, elapsed / 16.67);
    currentX += (x - currentX) * amount;
    currentY += (y - currentY) * amount;
    if (Math.hypot(x - currentX, y - currentY) < .1) {
      currentX = x;
      currentY = y;
      render();
      stop();
      return;
    }
    render();
    frame = window.requestAnimationFrame(animate);
  }

  function hide() {
    stop();
    visible = false;
    cursor.classList.remove('is-visible', 'is-interactive');
    document.documentElement.classList.remove('custom-cursor-active');
  }

  function updateHover(target) {
    const element = target instanceof Element ? target : null;
    // Native editing/disabled cursors are independent of the decoration's visibility.
    const preserveNative = Boolean(element?.closest('input, textarea, [contenteditable]:not([contenteditable="false"]), :disabled, [aria-disabled="true"]'));
    const isInteractive = !preserveNative && Boolean(element?.closest(interactive));
    const active = visible;
    const wasActive = cursor.classList.contains('is-visible');
    cursor.classList.toggle('is-visible', active);
    cursor.classList.toggle('is-interactive', active && isInteractive);
    // Replace the system pointer only for the previously approved hover state.
    document.documentElement.classList.toggle('custom-cursor-active', active && isInteractive);
    if (!active) {
      stop();
    } else if (isInteractive || !wasActive) {
      stop();
      currentX = x;
      currentY = y;
      render();
    } else if (!frame && Math.hypot(x - currentX, y - currentY) >= .1) {
      frame = window.requestAnimationFrame(animate);
    }
  }

  function move(event) {
    if (event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    visible = true;
    updateHover(event.target);
  }

  function sync() {
    controller?.abort();
    hide();
    if (!capability.matches) return;
    controller = new AbortController();
    const options = { passive: true, signal: controller.signal };
    on(document, 'pointermove', move, options);
    on(document, 'pointerover', move, options);
    on(document, 'keydown', event => { if (event.key === 'Tab') hide(); }, options);
    // Child transitions and DOM changes must not be mistaken for a viewport exit.
    on(document.documentElement, 'pointerleave', hide, options);
    on(document, 'pointerdown', event => { if (event.pointerType !== 'mouse') hide(); }, options);
    on(document, 'scroll', () => {
      if (visible) updateHover(document.elementFromPoint(x, y));
    }, { ...options, capture: true });
    on(document, 'visibilitychange', () => { if (document.hidden) hide(); }, options);
    on(window, 'blur', hide, options);
  }

  on(capability, 'change', sync);
  on(window, 'pagehide', () => { controller?.abort(); hide(); });
  on(window, 'pageshow', sync);
  sync();
  return () => {
    dispose()
    controller?.abort();
    hide();
    cursor.style.removeProperty('transform');
  }
}
