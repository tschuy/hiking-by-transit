import { eventContent, guideContent, hikeContent, pageContent, placeContent, postContent, visiblePlaceContent } from '../data/content'
import { getPark, trailheads } from '../data/trails'

export type SearchResultType = 'Event' | 'Guide' | 'Hike' | 'Page' | 'Place' | 'Post' | 'Trailhead'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  description: string
  href: string
  searchableText: string
}

const searchResults: SearchResult[] = [
  ...hikeContent.map((hike): SearchResult => {
    const placeNames = hike.place_ids.map((id) => placeContent.find((place) => place.place_id === id)?.title).filter(Boolean)
    return {
      id: `hike-${hike.slug}`,
      type: 'Hike',
      title: hike.title,
      description: `${hike.difficulty_human ?? hike.difficulty} · ${hike.length}${placeNames.length ? ` · ${placeNames.at(-1)}` : ''}`,
      href: `/hikes/${hike.slug}`,
      searchableText: [hike.title, hike.blurb, hike.difficulty, ...hike.tags, ...placeNames].filter(Boolean).join(' '),
    }
  }),
  ...visiblePlaceContent.map((place): SearchResult => ({
    id: `place-${place.slug}`,
    type: 'Place',
    title: place.title,
    description: place.blurb ?? `${place.kind} guide`,
    href: `/places/${place.slug}`,
    searchableText: `${place.title} ${place.blurb ?? ''} ${place.kind}`,
  })),
  ...postContent.map((post): SearchResult => ({ id: `post-${post.slug}`, type: 'Post', title: post.title, description: `Published ${post.date}`, href: post.url, searchableText: `${post.title} ${post.body}` })),
  ...eventContent.map((event): SearchResult => ({ id: `event-${event.slug}`, type: 'Event', title: event.title, description: event.event_date, href: event.url, searchableText: `${event.title} ${event.body}` })),
  ...guideContent.map((guide): SearchResult => ({ id: `guide-${guide.slug}`, type: 'Guide', title: guide.title, description: 'Transit planning guide', href: `/guides/${guide.slug}`, searchableText: `${guide.title} ${guide.body}` })),
  ...pageContent.map((page): SearchResult => ({ id: `page-${page.slug}`, type: 'Page', title: page.title, description: 'Hiking by Transit information', href: `/${page.slug}`, searchableText: `${page.title} ${page.body}` })),
  ...trailheads.map((trailhead): SearchResult => {
    const park = getPark(trailhead.parkSlug)
    const transitTerms = trailhead.transitRoutes
      .flatMap((route) => [route.agency, route.routeName, route.mode])
      .join(' ')
    return {
      id: `trailhead-${trailhead.slug}`,
      type: 'Trailhead',
      title: trailhead.name,
      description: `${trailhead.walkFromStopMinutes} min from transit${park ? ` · ${park.name}` : ''}`,
      href: `/trailheads/${trailhead.slug}`,
      searchableText: `${trailhead.name} ${trailhead.stopName} ${park?.name ?? ''} ${transitTerms}`,
    }
  }),
]

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function searchSite(query: string, limit = 8) {
  const normalizedQuery = normalize(query)
  if (normalizedQuery.length < 2) return []

  return searchResults
    .map((result) => {
      const title = normalize(result.title)
      const text = normalize(result.searchableText)
      const score = title === normalizedQuery
        ? 0
        : title.startsWith(normalizedQuery)
          ? 1
          : title.includes(normalizedQuery)
            ? 2
            : text.includes(normalizedQuery)
              ? 3
              : Number.POSITIVE_INFINITY
      return { result, score }
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score || a.result.title.localeCompare(b.result.title))
    .slice(0, limit)
    .map(({ result }) => result)
}
