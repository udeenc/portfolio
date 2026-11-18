// Match the original script's once-per-page year calculation.
const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer-v2">
      <div className="footer-v2__inner container">
        <p>© <span id="year">{currentYear}</span> Candra Wijaya</p>
        <p>Data Analytics &amp; Data Engineering</p>
        <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  )
}
