import { useEffect } from 'react'
import CustomCursor from './components/CustomCursor.jsx'
import { mountSmoothScroll } from './effects/smoothScroll.js'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import FeaturedProjects from './components/FeaturedProjects.jsx'
import Projects from './components/Projects.jsx'
import Skills from './components/Skills.jsx'
import Education from './components/Education.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  useEffect(() => mountSmoothScroll(), [])

  return (
    <>
      <CustomCursor />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <FeaturedProjects />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
