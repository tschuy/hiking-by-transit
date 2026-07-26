import { describe, expect, it } from 'vitest'
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

  it('separates a trailhead entrance from its destination names for display', () => {
    const result = searchSite('Hidden Beach Trailhead').find((candidate) => candidate.type === 'Trailhead')
    expect(result).toMatchObject({
      title: 'Redwood National and State Parks',
      description: 'Hidden Beach Trailhead',
    })
    expect(result?.detail).toContain('from transit')
  })

  it('includes outdoor destinations with their canonical routes', () => {
    expect(searchSite('Pacific Crest Trail').some((result) => result.type === 'Destination' && result.href === '/destinations/pacific-crest-trail')).toBe(true)
  })

  it('matches non-adjacent query terms and ranks destinations above trailheads', () => {
    const results = searchSite('national park', 24)
    expect(results.some((result) => result.type === 'Destination' && result.title === 'Redwood National and State Parks')).toBe(true)
    expect(searchSite('national park', 5).some((result) => result.title === 'Redwood National and State Parks')).toBe(true)
    const lastDestination = results.findLastIndex((result) => result.type === 'Destination')
    const firstTrailhead = results.findIndex((result) => result.type === 'Trailhead')
    expect(firstTrailhead).toBeGreaterThan(lastDestination)
  })

  it('uses an owning place instead of a duplicate destination result', () => {
    const results = searchSite('Yosemite National Park')
    expect(results.some((result) => result.type === 'Place' && result.href === '/places/yosemite-national-park')).toBe(true)
    expect(results.some((result) => result.type === 'Destination' && result.title === 'Yosemite National Park')).toBe(false)
  })
})
