export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="wordmark" href="#search">
          <span className="wordmark__mark" aria-hidden="true" />
          Northline
        </a>
        <p className="site-header__tag">Listing search</p>
      </div>
    </header>
  );
}
