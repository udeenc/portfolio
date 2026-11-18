// Only repository-verified destinations are enabled. Add a verified destination
// to an unavailable entry here when ready; the same row supports native links.
const contactEntries = [
  { label: 'Email Me', href: null, status: 'Unavailable' },
  { label: 'GitHub', href: 'https://github.com/udeenc' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/candra-wijaya-36a008347' },
  { label: 'View My CV', href: null, status: 'Coming Soon', document: true },
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
      {entry.href && <span className="sr-only"> (opens in a new tab)</span>}
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
                <a className="contact-v2__row" href={entry.href} target="_blank" rel="noopener noreferrer">
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
