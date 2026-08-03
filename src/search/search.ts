import { eventContent, getGuidePath, guideContent, hikeContent, pageContent, placeContent, postContent, visiblePlaceContent } from '../data/content'
import { catalogDestinations, catalogTrailheads, getCatalogDestinationById, getCatalogPlace, getCatalogTrailheadById, getDestinationPath, getOwnedCatalogDestinations } from '../data/trailheadCatalog'

export type SearchResultType = 'Destination' | 'Event' | 'Guide' | 'Hike' | 'Page' | 'Post' | 'Trailhead'

export interface SearchResult {
  id: string
  type: SearchResultType
  badgeLabel?: 'Forest' | 'National' | 'National Park' | 'Park' | 'Trail'
  title: string
  description: string
  detail?: string
  href: string
  searchableText: string
  destinationText?: string
  trailheadSpecificText?: string
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
  ...visiblePlaceContent.map((place): SearchResult => {
    const ownedDestinations = getOwnedCatalogDestinations(place.place_id)
    const destinationTrailheads = ownedDestinations.flatMap((destination) => destination.trailheadIds).map(getCatalogTrailheadById).filter((trailhead) => trailhead !== undefined)
    const accessTerms = destinationTrailheads.flatMap((trailhead) => trailhead.access.flatMap((access) => [access.stopName, ...access.routeIds]))
    return {
      id: `place-${place.slug}`,
      type: 'Guide',
      badgeLabel: /national (?:park|and state parks)/i.test(place.title) ? 'National Park' : undefined,
      title: place.title,
      description: ownedDestinations.length > 0 ? `Destination guide · ${new Set(destinationTrailheads.map((trailhead) => trailhead.id)).size} transit-accessible trailheads` : place.blurb ?? `${place.kind} guide`,
      href: `/guides/${place.slug}`,
      searchableText: [place.title, place.blurb, place.kind, ...ownedDestinations.map((destination) => destination.name), ...destinationTrailheads.map((trailhead) => trailhead.name), ...accessTerms].filter(Boolean).join(' '),
    }
  }),
  ...postContent.map((post): SearchResult => ({ id: `post-${post.slug}`, type: 'Post', title: post.title, description: `Published ${post.date}`, href: post.url, searchableText: `${post.title} ${post.body}` })),
  ...eventContent.map((event): SearchResult => ({ id: `event-${event.slug}`, type: 'Event', title: event.title, description: event.event_date, href: event.url, searchableText: `${event.title} ${event.body}` })),
  ...guideContent.map((guide): SearchResult => ({ id: `guide-${guide.slug}`, type: 'Guide', title: guide.title, description: 'Transit planning guide', href: getGuidePath(guide.slug), searchableText: `${guide.title} ${guide.body}` })),
  ...pageContent.map((page): SearchResult => ({ id: `page-${page.slug}`, type: 'Page', title: page.title, description: 'Hiking by Transit information', href: `/${page.slug}`, searchableText: `${page.title} ${page.body}` })),
  ...catalogDestinations.filter((destination) => destination.placeId === null).map((destination): SearchResult => {
    const trailheads = destination.trailheadIds.map(getCatalogTrailheadById).filter((trailhead) => trailhead !== undefined)
    const accessTerms = trailheads.flatMap((trailhead) => trailhead.access.flatMap((access) => [access.stopName, ...access.routeIds]))
    return {
      id: `destination-${destination.slug}`,
      type: 'Destination',
      badgeLabel: /(?:state|national) forest/i.test(destination.name)
        ? 'Forest'
        : /national (?:park|and state parks)/i.test(destination.name)
          ? 'National Park'
          : /national (?:monument|seashore|scenic area)/i.test(destination.name)
            ? 'National'
            : /trail/i.test(destination.name)
              ? 'Trail'
              : 'Park',
      title: destination.name,
      description: `${trailheads.length} transit-accessible trailhead${trailheads.length === 1 ? '' : 's'}`,
      href: getDestinationPath(destination),
      searchableText: [destination.name, ...trailheads.map((trailhead) => trailhead.entranceName ?? trailhead.name), ...accessTerms].join(' '),
    }
  }),
  ...catalogTrailheads.map((trailhead): SearchResult => {
    const placeNames = trailhead.placeIds.map((id) => getCatalogPlace(id)?.title).filter(Boolean)
    const destinationNames = trailhead.destinationIds.map((id) => getCatalogDestinationById(id)?.name).filter(Boolean)
    const specialService = specialServiceDetails(trailhead.id)
    const access = trailhead.access.at(0)
    const walkMinutes = trailhead.access.map((item) => item.walkMinutes).filter((value): value is number => value !== null).sort((a, b) => a - b).at(0)
    const transitTerms = trailhead.access.flatMap((item) => item.routeIds).join(' ')
    const transitDescription = `${walkMinutes === undefined ? specialService?.label ?? 'Special access' : `${Math.round(walkMinutes)} min from transit`}${placeNames.length ? ` · ${placeNames.at(-1)}` : ''}`
    const destinationTitle = trailhead.entranceName ? trailhead.name.slice(0, trailhead.name.indexOf(':')).trim() : trailhead.name
    return {
      id: `trailhead-${trailhead.slug}`,
      type: 'Trailhead',
      title: destinationTitle,
      description: trailhead.entranceName ?? transitDescription,
      detail: trailhead.entranceName ? transitDescription : undefined,
      href: `/trailheads/${trailhead.slug}`,
      searchableText: `${trailhead.name} ${access?.stopName ?? ''} ${placeNames.join(' ')} ${transitTerms} ${specialService?.terms ?? ''} ${trailhead.notes ?? ''}`,
      destinationText: destinationNames.join(' '),
      trailheadSpecificText: `${trailhead.entranceName ?? ''} ${access?.stopName ?? ''} ${placeNames.join(' ')} ${transitTerms} ${specialService?.terms ?? ''} ${trailhead.notes ?? ''}`,
    }
  }),
]

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const resultTypePriority: Record<SearchResultType, number> = {
  Destination: 0,
  Event: 1,
  Guide: 1,
  Hike: 1,
  Page: 1,
  Post: 1,
  Trailhead: 2,
}

function specialServiceDetails(trailheadId: string) {
  if (trailheadId.startsWith('KML_SHUTTLES_')) return { label: 'Park shuttle access', terms: 'park shuttle shuttles' }
  if (trailheadId.startsWith('KML_MICROTRANSIT_')) return { label: 'On-demand service', terms: 'microtransit on-demand on demand' }
  if (trailheadId.startsWith('KML_CALL_AHEAD_')) return { label: 'Call-ahead service', terms: 'call-ahead call ahead' }
  return undefined
}

export function searchSite(query: string, limit = Number.POSITIVE_INFINITY) {
  const normalizedQuery = normalize(query)
  if (normalizedQuery.length < 2) return []
  const queryTerms = normalizedQuery.split(/\s+/)

  return searchResults
    .map((result) => {
      const title = normalize(result.title)
      const text = normalize(result.searchableText)
      const destinationText = normalize(result.destinationText ?? '')
      const trailheadSpecificText = normalize(result.trailheadSpecificText ?? '')
      const allTermsInTitle = queryTerms.every((term) => title.includes(term))
      const allTermsInText = queryTerms.every((term) => text.includes(term))
      const destinationOnlyMatch = result.type === 'Trailhead'
        && queryTerms.every((term) => destinationText.includes(term))
        && !queryTerms.every((term) => trailheadSpecificText.includes(term))
      const score = title === normalizedQuery
        ? 0
        : title.startsWith(normalizedQuery)
          ? 1
          : title.includes(normalizedQuery)
            ? 2
            : text.includes(normalizedQuery)
              ? 3
              : allTermsInTitle
                ? 4
                : allTermsInText
                  ? 5
                  : Number.POSITIVE_INFINITY
      const destinationTermMatchBoost = result.type === 'Destination' && score >= 4 ? 3 : 0
      const adjustedScore = score - destinationTermMatchBoost + (result.type === 'Trailhead' ? 4 : 0)
      const matchTier = allTermsInTitle && result.type === 'Guide'
        ? 0
        : allTermsInTitle && result.type === 'Destination'
          ? 1
          : 2
      return { result, score, adjustedScore, destinationOnlyMatch, matchTier }
    })
    .filter(({ score, destinationOnlyMatch }) => Number.isFinite(score) && !destinationOnlyMatch)
    .sort((a, b) => a.matchTier - b.matchTier || a.adjustedScore - b.adjustedScore || resultTypePriority[a.result.type] - resultTypePriority[b.result.type] || a.score - b.score || a.result.title.localeCompare(b.result.title))
    .slice(0, limit)
    .map(({ result }) => result)
}
