import { cvUrl } from '../data/contact.js'

// Email and PDF approved by the owner; social destinations remain unchanged.
const contactEntries = [
  { label: 'Email Me', href: 'mailto:wijayac2005@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/udeenc', newTab: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/candra-wijaya-36a008347', newTab: true },
  { label: 'View My CV', href: cvUrl, newTab: true, document: true },
]

function EntryContent({ entry }) {
  return (
    <>
      <span className="contact-v2__label">{entry.label}</span>
      {entry.status && <span className="contact-v2__status">{entry.status}</span>}
      {entry.document ? (
        <svg className="contact-v2__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
          <path d="M14 3H6v18h12V7l-4-4Z M14 3v5h4 M9 12h6 M9 16h6" />
        </svg>
      ) : <span className="contact-v2__icon" aria-hidden="true">{entry.href ? '↗' : '—'}</span>}
      {entry.newTab && <span className="sr-only">{entry.document ? ' (PDF, opens in a new tab)' : ' (opens in a new tab)'}</span>}
    </>
  )
}

export default function Contact() {
  return (
    <section className="contact-v2" id="contact" aria-labelledby="contact-title">
      <div className="contact-v2__inner container">
        <div className="contact-v2__intro">
          <p className="homepage-label contact-v2__eyebrow">04 / CONTACT</p>
          <h2 id="contact-title">Let's build something meaningful.</h2>
          <p className="contact-v2__description">I'm open to internship opportunities and conversations around data engineering, analytics, and software development.</p>
        </div>
        <ul className="contact-v2__entries" aria-label="Contact options">
          {contactEntries.map(entry => (
            <li key={entry.label}>
              {entry.href ? (
                <a className={`contact-v2__row${entry.document ? ' contact-v2__row--cv' : ''}`} href={entry.href} target={entry.newTab ? '_blank' : undefined} rel={entry.newTab ? 'noopener noreferrer' : undefined}>
                  <EntryContent entry={entry} />
                </a>
              ) : (
                <div className={`contact-v2__row contact-v2__row--unavailable${entry.document ? ' contact-v2__row--cv' : ''}`}>
                  <EntryContent entry={entry} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
