import { describe, expect, it } from 'vitest'
import { catalogDestinations, catalogTrailheads, enrichTrailheadKml, getCatalogDestinationById, getCatalogTrailheadById, trailheadCatalog } from './trailheadCatalog'

describe('trailhead catalog', () => {
  it('contains all authoritative trailhead records with stable slugs', () => {
    expect(catalogTrailheads).toHaveLength(618)
    expect(new Set(catalogTrailheads.map((trailhead) => trailhead.slug)).size).toBe(catalogTrailheads.length)
    expect(trailheadCatalog.counts.accessRecords).toBe(614)
  })

  it('generates unique destinations and bidirectional trailhead relationships', () => {
    expect(catalogDestinations).toHaveLength(trailheadCatalog.counts.destinations)
    expect(catalogDestinations.length).toBeGreaterThan(0)
    expect(new Set(catalogDestinations.map((destination) => destination.slug)).size).toBe(catalogDestinations.length)
    const trailhead = catalogTrailheads.find((candidate) => candidate.destinationIds.length > 1)!
    const destinations = trailhead.destinationIds.map(getCatalogDestinationById)
    expect(destinations.every((destination) => destination?.trailheadIds.includes(trailhead.id))).toBe(true)
    expect(catalogDestinations.find((destination) => destination.name === 'Pacific Crest Trail')?.trailheadIds).toHaveLength(10)
    expect(catalogDestinations.some((destination) => destination.name === 'Miller/Knox Regional Shoreline')).toBe(true)
  })

  it('includes canonical hand-maintained KML trailheads and provenance', () => {
    expect(catalogTrailheads.filter((trailhead) => trailhead.id.startsWith('KML_'))).toHaveLength(45)
    expect(trailheadCatalog.source.kmlSources.map((source) => source.path)).toEqual([
      'data/kml/shuttles.kml', 'data/kml/microtransit.kml', 'data/kml/call-ahead.kml',
    ])
  })

  it('provides reverse hike relationships while leaving Sutro/Glen Canyon intentionally unmapped', () => {
    expect(getCatalogTrailheadById('TH_2240612')?.hikeIds).toContain('hike-siesta-valley')
    expect(trailheadCatalog.hikes.find((hike) => hike.slug === 'sutro-glen-canyon')?.trailheadIds).toEqual([])
  })

  it('enriches map features with catalog IDs and structured filter fields', () => {
    const trailhead = getCatalogTrailheadById('TH_2240612')!
    const enriched = enrichTrailheadKml(`<kml><Document><Placemark><name>${trailhead.name}</name><Point><coordinates>${trailhead.coordinates.join(',')},0</coordinates></Point></Placemark></Document></kml>`)
    expect(enriched).toContain('name="trailhead_id"')
    expect(enriched).toContain('TH_2240612')
    expect(enriched).toContain('name="has_hike_guide"')
    expect(enriched).toContain('name="place_slugs"')
  })

  it('resolves canonical KML features within their own source namespace', () => {
    const trailhead = catalogTrailheads.find((candidate) => candidate.id.startsWith('KML_SHUTTLES_'))!
    const enriched = enrichTrailheadKml(`<kml><Document><Placemark><name>${trailhead.name}</name><Point><coordinates>${trailhead.coordinates.join(',')},0</coordinates></Point></Placemark></Document></kml>`, 'shuttles')
    expect(enriched).toContain(trailhead.id)
  })
})
