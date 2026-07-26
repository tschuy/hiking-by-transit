import { describe, expect, it } from 'vitest'
import { catalogTrailheads } from '../data/trailheadCatalog'
import { searchSite } from './search'

describe('site search', () => {
  it('requires a meaningful query and respects result limits', () => {
    expect(searchSite('m')).toEqual([])
    expect(searchSite('trail', 3)).toHaveLength(3)
    expect(searchSite('trail').length).toBeGreaterThan(24)
  })

  it('ranks exact and prefix title matches before body matches', () => {
    const results = searchSite('Marin')
    expect(results[0]?.title).toBe('Marin')
    expect(results.some((result) => result.href === '/places/marin')).toBe(true)
  })

  it('normalizes case and accents', () => {
    expect(searchSite('YOSEMITE').some((result) => result.title.toLowerCase().includes('yosemite'))).toBe(true)
  })

  it('searches authoritative trailheads', () => {
    expect(searchSite('De Laveaga').some((result) => result.href === '/trailheads/siesta-valley-de-laveaga-trail')).toBe(true)
  })

  it.each([
    ['shuttles', 'KML_SHUTTLES_'],
    ['on-demand', 'KML_MICROTRANSIT_'],
    ['call-ahead', 'KML_CALL_AHEAD_'],
  ])('searches KML special-service places by %s', (query, idPrefix) => {
    const matchingSlugs = new Set(catalogTrailheads.filter((trailhead) => trailhead.id.startsWith(idPrefix)).map((trailhead) => trailhead.slug))
    expect(searchSite(query).some((result) => result.type === 'Trailhead' && matchingSlugs.has(result.href.replace('/trailheads/', '')))).toBe(true)
  })

  it('separates a trailhead entrance from its destination names for display', () => {
    const result = searchSite('Hidden Beach Trailhead').find((candidate) => candidate.type === 'Trailhead')
    expect(result).toMatchObject({
      title: 'Redwood National and State Parks',
      description: 'Hidden Beach Trailhead',
    })
    expect(result?.detail).toContain('from transit')
  })

  it('does not repeat trailheads when only their destination name matches', () => {
    const destinationName = 'Dr. Aurelia Reinhardt Redwood Regional Park'
    const broadResults = searchSite('Aurelia Reinhardt Redwood')
    expect(broadResults.some((result) => result.type === 'Destination' && result.title === destinationName)).toBe(true)
    expect(broadResults.some((result) => result.type === 'Trailhead' && result.title === destinationName)).toBe(false)

    expect(searchSite('Richard C Trudeau').some((result) => result.type === 'Trailhead' && result.title === destinationName)).toBe(true)
  })

  it('includes outdoor destinations with their canonical routes', () => {
    expect(searchSite('Pacific Crest Trail').find((result) => result.type === 'Destination' && result.href === '/destinations/pacific-crest-trail')).toMatchObject({ badgeLabel: 'Trail' })
    expect(searchSite('Aurelia Reinhardt Redwood').find((result) => result.type === 'Destination')).toMatchObject({ badgeLabel: 'Park' })
    expect(searchSite('National Forest').find((result) => result.type === 'Destination' && result.title.includes('National Forest'))).toMatchObject({ badgeLabel: 'Forest' })
    expect(searchSite('Redwood National State Parks').find((result) => result.type === 'Destination' && result.title === 'Redwood National and State Parks')).toMatchObject({ badgeLabel: 'National Park' })
    expect(searchSite('National Monument').find((result) => result.type === 'Destination' && result.title.includes('National Monument'))).toMatchObject({ badgeLabel: 'National' })
    expect(searchSite('National Seashore').find((result) => result.type === 'Destination' && result.title.includes('National Seashore'))).toMatchObject({ badgeLabel: 'National' })
    expect(searchSite('National Scenic Area').find((result) => result.type === 'Destination' && result.title.includes('National Scenic Area'))).toMatchObject({ badgeLabel: 'National' })
  })

  it('matches non-adjacent query terms and ranks destinations above trailheads', () => {
    const results = searchSite('national park', 24)
    expect(results.some((result) => result.type === 'Destination' && result.title === 'Redwood National and State Parks')).toBe(true)
    expect(searchSite('national park', 5).some((result) => result.title === 'Redwood National and State Parks')).toBe(true)
    const yosemiteIndex = results.findIndex((result) => result.type === 'Place' && result.title === 'Yosemite National Park')
    const channelIslandsIndex = results.findIndex((result) => result.type === 'Place' && result.title === 'Channel Islands National Park')
    const sequoiaIndex = results.findIndex((result) => result.type === 'Destination' && result.title === 'Sequoia National Park')
    const redwoodIndex = results.findIndex((result) => result.type === 'Destination' && result.title === 'Redwood National and State Parks')
    expect(yosemiteIndex).toBeGreaterThanOrEqual(0)
    expect(channelIslandsIndex).toBeGreaterThanOrEqual(0)
    expect(sequoiaIndex).toBeGreaterThan(channelIslandsIndex)
    expect(redwoodIndex).toBeGreaterThan(yosemiteIndex)
    const lastDestination = results.findLastIndex((result) => result.type === 'Destination')
    const firstTrailhead = results.findIndex((result) => result.type === 'Trailhead')
    expect(firstTrailhead).toBeGreaterThan(lastDestination)
  })

  it('uses an owning place instead of a duplicate destination result', () => {
    const results = searchSite('Yosemite National Park')
    expect(results.find((result) => result.type === 'Place' && result.href === '/places/yosemite-national-park')).toMatchObject({ badgeLabel: 'National Park' })
    expect(results.some((result) => result.type === 'Destination' && result.title === 'Yosemite National Park')).toBe(false)
  })
})
