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
