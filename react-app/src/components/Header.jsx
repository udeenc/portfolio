import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 800px)')
    const resetMenu = () => setMenuOpen(false)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && viewport.matches && menuOpen) {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    viewport.addEventListener('change', resetMenu)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      viewport.removeEventListener('change', resetMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="site-header">
        <nav className="container nav" aria-label="Main navigation">
          <div className="nav-brand">
            <a className="wordmark" href="#home" aria-label="Candra Wijaya home">cw<span>.</span></a>
            <span className="nav-separator" aria-hidden="true">|</span>
            <span className="small-label nav-name">CANDRA WIJAYA</span>
          </div>
          <button ref={toggleRef} className="nav-toggle" type="button" aria-expanded={menuOpen} aria-controls="nav-links" onClick={() => setMenuOpen((open) => !open)}>Menu <span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
          <ul className={`nav-links${menuOpen ? '' : ' is-collapsed'}`} id="nav-links" onClick={(event) => { if (event.target.closest('a')) setMenuOpen(false) }}>
            <li><a href="#about">About</a></li>
            <li><a href="#featured">Work</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#education">Education</a></li>
            <li><a className="nav-contact" href="#contact">Let’s connect <span aria-hidden="true">↗</span></a></li>
          </ul>
        </nav>
      </header>
  )
}
