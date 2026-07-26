import { describe, expect, it } from 'vitest'
import { searchSite } from './search'

describe('site search', () => {
  it('requires a meaningful query and respects result limits', () => {
    expect(searchSite('m')).toEqual([])
    expect(searchSite('trail', 3)).toHaveLength(3)
  })

  it('ranks exact and prefix title matches before body matches', () => {
    const results = searchSite('Marin')
    expect(results[0]?.title).toBe('Marin')
    expect(results.some((result) => result.href === '/places/marin')).toBe(true)
  })

  it('normalizes case and accents', () => {
    expect(searchSite('YOSEMITE').some((result) => result.title.toLowerCase().includes('yosemite'))).toBe(true)
  })

  it('searches authoritative GeoPackage trailheads', () => {
    expect(searchSite('De Laveaga').some((result) => result.href === '/trailheads/siesta-valley-de-laveaga-trail')).toBe(true)
  })
})
