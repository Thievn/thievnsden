export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="footer-name">Thievn&apos;s Den</p>
      <p>The lamps stay low.</p>
      <p className="footer-year">© {new Date().getFullYear()}</p>
    </footer>
  );
}
