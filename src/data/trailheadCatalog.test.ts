import { describe, expect, it } from 'vitest'
import { catalogTrailheads, enrichTrailheadKml, getCatalogTrailheadById, trailheadCatalog } from './trailheadCatalog'

describe('trailhead catalog', () => {
  it('contains the authoritative GeoPackage records with stable slugs', () => {
    expect(catalogTrailheads).toHaveLength(577)
    expect(new Set(catalogTrailheads.map((trailhead) => trailhead.slug)).size).toBe(catalogTrailheads.length)
    expect(trailheadCatalog.counts.accessRecords).toBe(614)
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
})
