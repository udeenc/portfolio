/* Progressive enhancement: all content and links work without JavaScript. */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#nav-links');
const mobileViewport = window.matchMedia('(max-width: 800px)');

function setMenuOpen(isOpen) {
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navLinks.classList.toggle('is-collapsed', mobileViewport.matches && !isOpen);
  navToggle.querySelector('span').textContent = isOpen ? '−' : '+';
}

if (navToggle && navLinks) {
  navToggle.hidden = false;
  setMenuOpen(false);

  navToggle.addEventListener('click', () => {
    setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a') && mobileViewport.matches) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileViewport.matches && navToggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  mobileViewport.addEventListener('change', () => setMenuOpen(false));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

/* Hero rotation: stable grid sizing, a manual pause, and no live announcements. */
(() => {
  const hero = document.querySelector('.hero');
  const toggle = hero?.querySelector('.hero-motion-toggle');
  const roles = hero?.querySelectorAll('.hero-role');
  if (!toggle || !roles || roles.length < 2) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer = 0;
  let paused = false;
  let inView = true;
  let pageActive = true;

  function syncRotation() {
    window.clearTimeout(timer);
    timer = 0;
    toggle.hidden = motion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} rotating focus text`);
    toggle.textContent = paused ? 'Resume rotation ↻' : 'Pause rotation Ⅱ';
    if (motion.matches) {
      roles[index].classList.remove('is-active');
      index = 0;
      roles[index].classList.add('is-active');
    }
    if (paused || motion.matches || document.hidden || !inView || !pageActive) return;
    timer = window.setTimeout(() => {
      roles[index].classList.remove('is-active');
      index = (index + 1) % roles.length;
      roles[index].classList.add('is-active');
      syncRotation();
    }, 4500);
  }

  toggle.addEventListener('click', () => { paused = !paused; syncRotation(); });
  motion.addEventListener('change', syncRotation);
  document.addEventListener('visibilitychange', syncRotation);
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncRotation();
  }) : null;
  observer?.observe(hero);
  window.addEventListener('pagehide', () => {
    pageActive = false;
    window.clearTimeout(timer);
    observer?.disconnect();
  });
  window.addEventListener('pageshow', () => {
    pageActive = true;
    observer?.observe(hero);
    syncRotation();
  });
  syncRotation();
})();

/* Single cursor: a fluid default trail, precise hover, CSS-only shape transitions. */
(() => {
  const cursor = document.querySelector('.custom-cursor');
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
    document.addEventListener('pointermove', move, options);
    document.addEventListener('pointerover', move, options);
    // Child transitions and DOM changes must not be mistaken for a viewport exit.
    document.documentElement.addEventListener('pointerleave', hide, options);
    document.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') hide(); }, options);
    document.addEventListener('scroll', () => {
      if (visible) updateHover(document.elementFromPoint(x, y));
    }, { ...options, capture: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); }, options);
    window.addEventListener('blur', hide, options);
  }

  capability.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { controller?.abort(); hide(); });
  window.addEventListener('pageshow', sync);
  sync();
})();
