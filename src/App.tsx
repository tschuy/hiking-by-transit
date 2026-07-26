/* eslint-disable react-refresh/only-export-components -- route metadata is shared with the build-time renderer */
import { useEffect, type ReactNode } from 'react'
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
import {
  eventContent, getEventContent, getGuideContent, getGuidePath, getHikeContent, getPageContent, getPlaceContent, getPostContent,
  guideContent, hikeContent, pageContent, placeContent, postContent,
} from './data/content'
import { catalogTrailheads, getCatalogTrailhead } from './data/trailheadCatalog'

const siteName = 'Hiking by Transit'
const siteUrl = 'https://hikingbytransit.com'

export interface RouteMetadata {
  title: string
  description: string
  canonicalPath: string
  socialImage: string
  structuredData?: Record<string, unknown>
}

export interface ResolvedRoute {
  element: ReactNode
  metadata: RouteMetadata
}

const descriptions = {
  home: 'Transit-accessible hikes, parks, and trailheads across California.',
  hikes: 'Find California hikes you can reach by bus, train, ferry, or shuttle.',
  places: 'Explore California regions and parks with practical public-transit guidance.',
  posts: 'News, trip-planning resources, and guides from Hiking by Transit.',
  events: 'Upcoming and past transit-accessible hiking events.',
  trailheads: 'Explore transit-accessible trailheads across California on an interactive map.',
}

function plainText(value?: string): string | undefined {
  const text = value?.replace(/<[^>]+>/g, ' ').replace(/[#*_`>[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, 180) : undefined
}

function contentImage(image?: string, body?: string): string | undefined {
  if (image) return image.startsWith('/') || image.startsWith('http') ? image : `/assets/${image}`
  return body?.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/)?.[1]
}

function metadata(title: string, canonicalPath: string, description = descriptions.home, structuredData?: Record<string, unknown>, image?: string): RouteMetadata {
  const imagePath = image ?? '/assets/preview.png'
  return {
    title: title === siteName ? siteName : `${title} · ${siteName}`,
    description,
    canonicalPath,
    socialImage: imagePath.startsWith('http') ? imagePath : `${siteUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`,
    structuredData,
  }
}

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
    '/guides/getting-to-marin': '/marin/getting-to-marin',
    '/guides/samcoast': '/peninsula/samcoast',
}

export function resolveRoute(pathname: string): ResolvedRoute {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  if (legacyRedirects[normalizedPath]) return { element: <RedirectPage to={legacyRedirects[normalizedPath]} />, metadata: metadata('Page moved', normalizedPath) }

  if (normalizedPath === '/') return { element: <HomePage />, metadata: metadata(siteName, '/', descriptions.home) }
  if (normalizedPath === '/hikes') return { element: <HikesPage />, metadata: metadata('Hikes', normalizedPath, descriptions.hikes) }
  if (normalizedPath === '/places') return { element: <PlacesPage />, metadata: metadata('Places', normalizedPath, descriptions.places) }
  if (normalizedPath === '/posts') return { element: <PostsPage />, metadata: metadata('Posts', normalizedPath, descriptions.posts) }
  if (normalizedPath === '/events') return { element: <EventsPage />, metadata: metadata('Events', normalizedPath, descriptions.events) }
  if (normalizedPath === '/trailheads') return { element: <TrailheadsPage />, metadata: metadata('Trailhead map', normalizedPath, descriptions.trailheads) }
  if (['/resources', '/media', '/about-data'].includes(normalizedPath)) {
    const page = getPageContent(normalizedPath.slice(1))
    if (page) return { element: <ContentPage slug={page.slug} />, metadata: metadata(page.title, normalizedPath, plainText(page.body), undefined, contentImage(undefined, page.body)) }
  }
  const specialGuides: Record<string, string> = { '/marin/getting-to-marin': 'getting-to-marin', '/peninsula/samcoast': 'samcoast' }
  const specialGuide = specialGuides[normalizedPath] ? getGuideContent(specialGuides[normalizedPath]) : undefined
  if (specialGuide) return { element: <GuidePage slug={specialGuide.slug} />, metadata: metadata(specialGuide.title, normalizedPath, plainText(specialGuide.body), undefined, contentImage(undefined, specialGuide.body)) }

  const eventMatch = normalizedPath.match(/^\/events\/([^/]+)$/)
  if (eventMatch) {
    const event = getEventContent(decodeURIComponent(eventMatch[1]))
    if (event) return { element: <EventPage slug={event.slug} />, metadata: metadata(event.title, normalizedPath, plainText(event.body), undefined, contentImage(undefined, event.body)) }
  }

  const trailheadMatch = normalizedPath.match(/^\/trailheads\/([^/]+)$/)
  if (trailheadMatch) {
    const trailhead = getCatalogTrailhead(decodeURIComponent(trailheadMatch[1]))
    if (trailhead) return { element: <TrailheadPage slug={trailhead.slug} />, metadata: metadata(trailhead.name, normalizedPath, trailhead.notes && trailhead.notes.length > 20 ? trailhead.notes : descriptions.trailheads) }
  }

  const hikeMatch = normalizedPath.match(/^\/(?:trips|hikes)\/([^/]+)$/)
  if (hikeMatch) {
    const hike = getHikeContent(decodeURIComponent(hikeMatch[1]))
    if (hike) return { element: <HikePage slug={hike.slug} />, metadata: metadata(hike.title, normalizedPath, hike.blurb ?? plainText(hike.body), undefined, contentImage(hike.image, hike.body)) }
  }

  const postMatch = normalizedPath.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)$/)
  if (postMatch) {
    const post = getPostContent(`${postMatch[1]}-${postMatch[2]}-${postMatch[3]}`, decodeURIComponent(postMatch[4]))
    if (post) {
      const canonicalPath = post.url.replace(/\/$/, '') || '/'
      const structuredData = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, datePublished: post.date, mainEntityOfPage: `${siteUrl}${canonicalPath}`, ...(post.image ? { image: `${siteUrl}/assets/${post.image}` } : {}) }
      return { element: <PostPage date={post.date} slug={post.slug} />, metadata: metadata(post.title, canonicalPath, plainText(post.body), structuredData, contentImage(post.image, post.body)) }
    }
  }

  const placeMatch = normalizedPath.match(/^\/(?:places|parks|regions)\/([^/]+)$/)
  if (placeMatch) {
    const place = getPlaceContent(decodeURIComponent(placeMatch[1]))
    if (place) return { element: <PlacePage slug={place.slug} />, metadata: metadata(place.title, normalizedPath, place.blurb ?? plainText(place.body), undefined, contentImage(place.image, place.body)) }
  }

  const guideMatch = normalizedPath.match(/^\/guides\/([^/]+)$/)
  if (guideMatch) {
    const guide = getGuideContent(decodeURIComponent(guideMatch[1]))
    if (guide) return { element: <GuidePage slug={guide.slug} />, metadata: metadata(guide.title, normalizedPath, plainText(guide.body), undefined, contentImage(undefined, guide.body)) }
  }

  return { element: <NotFoundPage />, metadata: metadata('Page not found', normalizedPath) }
}

export const prerenderPaths = [...new Set([
  '/', '/hikes', '/places', '/posts', '/events', '/trailheads',
  ...pageContent.map((page) => `/${page.slug}`),
  ...hikeContent.map((hike) => `/hikes/${hike.slug}`),
  ...placeContent.filter((place) => place.place_id !== 'california').map((place) => `/places/${place.slug}`),
  ...guideContent.map((guide) => getGuidePath(guide.slug)),
  ...postContent.map((post) => post.url.replace(/\/$/, '') || '/'),
  ...eventContent.map((event) => event.url.replace(/\/$/, '')),
  ...catalogTrailheads.map((trailhead) => `/trailheads/${trailhead.slug}`),
])].sort()

function App({ pathname }: { pathname: string }) {
  const route = resolveRoute(pathname)

  useEffect(() => {
    document.title = route.metadata.title
  }, [route.metadata.title])

  return (
    <div className="site-frame">
      <SiteHeader />
      <main id="main-content">{route.element}</main>
      <SupportCta />
      <SiteFooter />
    </div>
  )
}

export default App
