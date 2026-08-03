import catalogJson from './catalog-v0.9.generated.json'
import type { CatalogDestination, CatalogTrailhead, TrailheadCatalog } from '../types/catalog'

export const trailheadCatalog = catalogJson as unknown as TrailheadCatalog
export const catalogTrailheads = trailheadCatalog.trailheads
export const catalogDestinations = trailheadCatalog.destinations

const byId = new Map(catalogTrailheads.map((trailhead) => [trailhead.id, trailhead]))
const bySlug = new Map(catalogTrailheads.map((trailhead) => [trailhead.slug, trailhead]))
const destinationById = new Map(catalogDestinations.map((destination) => [destination.id, destination]))
const destinationBySlug = new Map(catalogDestinations.map((destination) => [destination.slug, destination]))
const hikeById = new Map(trailheadCatalog.hikes.map((hike) => [hike.id, hike]))
const placeById = new Map(trailheadCatalog.places.map((place) => [place.id, place]))

export const getCatalogTrailhead = (slug: string) => bySlug.get(slug)
export const getCatalogTrailheadById = (id: string) => byId.get(id)
export const getCatalogDestination = (slug: string) => destinationBySlug.get(slug)
export const getCatalogDestinationById = (id: string) => destinationById.get(id)
export const getOwnedCatalogDestinations = (placeId: string) => catalogDestinations.filter((destination) => destination.placeId === placeId)
export const getDestinationPath = (destination: CatalogDestination) => {
  const place = destination.placeId ? placeById.get(destination.placeId) : undefined
  return place ? `/guides/${place.slug}` : `/destinations/${destination.slug}`
}
export const getCatalogHike = (id: string) => hikeById.get(id)
export const getCatalogPlace = (id: string) => placeById.get(id)

export function trailheadIdFromFeatureId(featureId: string): string | undefined {
  const candidate = featureId.slice(featureId.indexOf(':') + 1)
  return byId.has(candidate) ? candidate : undefined
}

export function catalogTrailheadForFeature(featureId: string): CatalogTrailhead | undefined {
  const id = trailheadIdFromFeatureId(featureId)
  return id ? byId.get(id) : undefined
}

const coordinateKey = ([longitude, latitude]: [number, number]) => `${longitude.toFixed(6)},${latitude.toFixed(6)}`
const byCoordinate = new Map<string, CatalogTrailhead[]>()
catalogTrailheads.forEach((trailhead) => byCoordinate.set(coordinateKey(trailhead.coordinates), [...(byCoordinate.get(coordinateKey(trailhead.coordinates)) ?? []), trailhead]))

export function enrichTrailheadKml(xml: string, sourceId?: string): string {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  for (const placemark of document.querySelectorAll('Placemark')) {
    const coordinates = placemark.querySelector('Point coordinates')?.textContent?.trim().split(',').slice(0, 2).map(Number)
    if (!coordinates || coordinates.length !== 2 || coordinates.some((value) => !Number.isFinite(value))) continue
    const candidates = byCoordinate.get(coordinateKey(coordinates as [number, number])) ?? []
    const kmlPrefix = sourceId ? `KML_${sourceId.replaceAll('-', '_').toUpperCase()}_` : undefined
    const trailhead = (kmlPrefix ? candidates.find((candidate) => candidate.id.startsWith(kmlPrefix)) : undefined)
      ?? candidates.find((candidate) => !candidate.id.startsWith('KML_'))
      ?? candidates[0]
    if (!trailhead) continue
    const values: Record<string, string> = {
      trailhead_id: trailhead.id,
      slug: trailhead.slug,
      walk_minutes: String(Math.min(...trailhead.access.map((item) => item.walkMinutes ?? Number.POSITIVE_INFINITY))),
      service_days: trailhead.serviceDays.join('|'),
      has_hike_guide: String(trailhead.hikeIds.length > 0),
      place_slugs: trailhead.placeIds.map((id) => placeById.get(id)?.slug).filter(Boolean).join('|'),
    }
    if (trailhead.reservationRequirement !== 'unknown') values.reservation_required = String(trailhead.reservationRequirement)
    if (trailhead.seasonalService !== 'unknown') values.seasonal_service = String(trailhead.seasonalService)
    const extendedData = document.createElement('ExtendedData')
    for (const [name, value] of Object.entries(values)) {
      if (value === 'Infinity') continue
      const data = document.createElement('Data')
      data.setAttribute('name', name)
      const node = document.createElement('value')
      node.textContent = value
      data.append(node)
      extendedData.append(data)
    }
    placemark.insertBefore(extendedData, placemark.querySelector('Point'))
  }
  return new XMLSerializer().serializeToString(document)
}
