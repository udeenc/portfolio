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

/* Hero greetings: one timer, stable accessible copy, and motion-aware lifecycle. */
(() => {
  const hero = document.querySelector('.hero');
  const writer = hero?.querySelector('.hero-typewriter');
  const text = writer?.querySelector('.hero-greeting-text');
  if (!writer || !text) return;
  const greetings = [
    'Curious about what I build?',
    "There's a story behind every project.",
    'Scroll down and take a look.'
  ];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let character = 0;
  let timer = 0;
  let phase = 'typing';
  let inView = false;
  let pageActive = true;
  let ready = false;

  function stop() {
    window.clearTimeout(timer);
    timer = 0;
    writer.classList.remove('is-typing');
  }

  function schedule(delay) {
    timer = window.setTimeout(step, delay);
  }

  function step() {
    timer = 0;
    if (phase === 'holding') {
      text.classList.add('is-changing');
      phase = 'changing';
      schedule(180);
    } else if (phase === 'changing') {
      index = (index + 1) % greetings.length;
      character = 0;
      text.textContent = '';
      text.classList.remove('is-changing');
      phase = 'typing';
      schedule(55);
    } else {
      character += 1;
      text.textContent = greetings[index].slice(0, character);
      if (character === greetings[index].length) {
        phase = 'holding';
        schedule(2000);
      } else {
        schedule(55);
      }
    }
  }

  function syncGreeting() {
    stop();
    if (motion.matches) {
      index = 0;
      character = 0;
      phase = 'typing';
      ready = false;
      text.textContent = greetings[0];
      text.classList.remove('is-changing');
      return;
    }
    if (document.hidden || !inView || !pageActive) return;
    writer.classList.add('is-typing');
    if (!ready) {
      // Begin after the greeting's entrance reveal so characters stay readable.
      ready = true;
      text.textContent = '';
      schedule(800);
    } else {
      schedule(phase === 'holding' ? 2000 : phase === 'changing' ? 180 : 55);
    }
  }

  motion.addEventListener('change', syncGreeting);
  document.addEventListener('visibilitychange', syncGreeting);
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncGreeting();
  }) : null;
  if (observer) observer.observe(hero);
  else inView = true;
  window.addEventListener('pagehide', () => {
    pageActive = false;
    stop();
    observer?.disconnect();
  });
  window.addEventListener('pageshow', () => {
    pageActive = true;
    observer?.observe(hero);
    syncGreeting();
  });
  syncGreeting();
})();

/* Scroll fade: one event-driven frame; measurements cached until layout changes. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let top = 0;
  let distance = 1;
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
      top = bounds.top + window.scrollY;
      distance = Math.max(bounds.height * .85, 1);
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
    requestUpdate();
  }

  function sync() {
    cancel();
    if (motion.matches) hero.style.removeProperty('--hero-opacity');
    else resize();
  }

  const observer = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  observer?.observe(hero);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  // Lenis notifies after writing the actual native scroll position in its frame.
  window.addEventListener('portfolio:smooth-scroll', () => { cancel(); update(); });
  window.addEventListener('resize', resize, { passive: true });
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { active = false; cancel(); observer?.disconnect(); });
  window.addEventListener('pageshow', () => { active = true; observer?.observe(hero); sync(); });
  sync();
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
