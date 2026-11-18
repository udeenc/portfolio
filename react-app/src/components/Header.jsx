import { useEffect, useRef, useState } from 'react'
import { mountHeaderMenu, mountHeaderNavigation, navigationLinks } from '../effects/headerNavigation.js'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)
  const menuRef = useRef(null)
  const headerRef = useRef(null)
  const [active, setActive] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const stopNavigation = mountHeaderNavigation(headerRef.current, setActive, setScrolled)
    const stopMenu = mountHeaderMenu(toggleRef.current, menuRef.current, setMenuOpen)
    return () => {
      stopNavigation()
      stopMenu()
    }
  }, [])

  return (
    <header ref={headerRef} className={`site-header header-v2${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' is-menu-open' : ''}`}>
        <nav className="container nav" aria-label="Main navigation">
          <div className="nav-brand">
            <a className="wordmark" href="#home" aria-label="Candra Wijaya home">cw<span>.</span></a>
            <span className="nav-separator" aria-hidden="true">|</span>
            <span className="small-label nav-name">CANDRA WIJAYA</span>
          </div>
          <button ref={toggleRef} className="nav-toggle" type="button" aria-expanded={menuOpen} aria-controls="nav-links" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>Menu <span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
          <ul ref={menuRef} className={`nav-links${menuOpen ? '' : ' is-collapsed'}`} id="nav-links">
            {navigationLinks.map(({ id, label }) => (
              <li key={id}><a href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a></li>
            ))}
          </ul>
        </nav>
      </header>
  )
}
