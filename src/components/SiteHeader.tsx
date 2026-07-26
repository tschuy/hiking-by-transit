export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="container header-inner">
        <a className="wordmark" href="/" aria-label="Hiking by Transit home">Hiking by Transit</a>
        <nav aria-label="Primary navigation">
          <ul className="nav-list">
            <li><a href="/trailheads">Trailhead map</a></li>
            <li><a href="/hikes">Hikes</a></li>
            <li><a href="/places">Places</a></li>
            <li><a href="/posts">Posts</a></li>
            <li><a href="/events">Events</a></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
