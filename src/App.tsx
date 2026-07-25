import { useEffect, useState } from 'react'
import './App.css'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { SupportCta } from './components/SupportCta'
import { HomePage } from './pages/HomePage'
import { HikePage } from './pages/HikePage'
import { HikesPage } from './pages/HikesPage'
import { GuidePage } from './pages/GuidePage'
import { ContentPage } from './pages/ContentPage'
import { EventPage } from './pages/EventPage'
import { EventsPage } from './pages/EventsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlacePage } from './pages/PlacePage'
import { PlacesPage } from './pages/PlacesPage'
import { RedirectPage } from './pages/RedirectPage'
import { PostPage } from './pages/PostPage'
import { PostsPage } from './pages/PostsPage'
import { TrailheadsPage } from './pages/TrailheadsPage'
import { TrailheadPage } from './pages/TrailheadPage'

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return pathname
}

function getPage(pathname: string) {
  const legacyRedirects: Record<string, string> = {
    '/map': '/trailheads',
    '/east-bay': '/places/east-bay',
    '/marin': '/places/marin',
    '/peninsula': '/places/peninsula',
    '/san-francisco': '/places/san-francisco',
    '/south-bay': '/places/south-bay',
    '/trips': '/places',
    '/docs/geopackage': '/about-data',
    '/settings': '/trailheads',
    '/hikes/channel-islands': '/places/channel-islands-national-park',
    '/hikes/redwood-national-park': '/places/redwood-national-and-state-parks',
    '/hikes/tahoe': '/places/tahoe',
    '/hikes/yosemite': '/places/yosemite-national-park',
    '/hikes/china-camp': '/places/marin',
  }
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  if (legacyRedirects[normalizedPath]) return <RedirectPage to={legacyRedirects[normalizedPath]} />

  if (pathname === '/') return <HomePage />
  if (pathname === '/hikes' || pathname === '/hikes/') return <HikesPage />
  if (pathname === '/places' || pathname === '/places/') return <PlacesPage />
  if (pathname === '/posts' || pathname === '/posts/') return <PostsPage />
  if (pathname === '/events' || pathname === '/events/') return <EventsPage />
  if (pathname === '/resources' || pathname === '/resources/') return <ContentPage slug="resources" />
  if (pathname === '/media' || pathname === '/media/') return <ContentPage slug="media" />
  if (pathname === '/about-data' || pathname === '/about-data/') return <ContentPage slug="about-data" />
  if (pathname === '/marin/getting-to-marin' || pathname === '/marin/getting-to-marin/') return <GuidePage slug="getting-to-marin" />
  if (pathname === '/peninsula/samcoast' || pathname === '/peninsula/samcoast/') return <GuidePage slug="samcoast" />

  const eventMatch = pathname.match(/^\/events\/([^/]+)\/?$/)
  if (eventMatch) return <EventPage slug={decodeURIComponent(eventMatch[1])} />
  if (pathname === '/trailheads' || pathname === '/trailheads/') return <TrailheadsPage />

  const trailheadMatch = pathname.match(/^\/trailheads\/([^/]+)\/?$/)
  if (trailheadMatch) return <TrailheadPage slug={decodeURIComponent(trailheadMatch[1])} />

  const tripMatch = pathname.match(/^\/trips\/([^/]+)\/?$/)
  if (tripMatch) {
    const slug = decodeURIComponent(tripMatch[1])
    return <HikePage slug={slug} />
  }

  const hikeMatch = pathname.match(/^\/hikes\/([^/]+)\/?$/)
  if (hikeMatch) return <HikePage slug={decodeURIComponent(hikeMatch[1])} />

  const postMatch = pathname.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/?$/)
  if (postMatch) return <PostPage date={`${postMatch[1]}-${postMatch[2]}-${postMatch[3]}`} slug={decodeURIComponent(postMatch[4])} />

  const placeMatch = pathname.match(/^\/(?:places|parks|regions)\/([^/]+)\/?$/)
  if (placeMatch) return <PlacePage slug={decodeURIComponent(placeMatch[1])} />

  const guideMatch = pathname.match(/^\/guides\/([^/]+)\/?$/)
  if (guideMatch) return <GuidePage slug={decodeURIComponent(guideMatch[1])} />

  return <NotFoundPage />
}

function App() {
  const pathname = usePathname()

  return (
    <div className="site-frame">
      <SiteHeader />
      <main id="main-content">{getPage(pathname)}</main>
      <SupportCta />
      <SiteFooter />
    </div>
  )
}

export default App
