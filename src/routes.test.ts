import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { prerenderPaths, resolveRoute } from './App'

describe('route resolution', () => {
  it('publishes unique canonical paths for every generated page', () => {
    expect(new Set(prerenderPaths).size).toBe(prerenderPaths.length)
    expect(prerenderPaths).toContain('/')
    expect(prerenderPaths).toContain('/hikes')
    expect(prerenderPaths).toContain('/trailheads')
    for (const pathname of prerenderPaths) {
      const { metadata } = resolveRoute(pathname)
      expect(metadata.title).not.toContain('Page not found')
      expect(metadata.description.length).toBeGreaterThan(20)
      expect(metadata.canonicalPath).toMatch(/^\//)
    }
  })

  it('resolves dynamic metadata and unknown slugs', () => {
    expect(resolveRoute('/places/marin/').metadata.title).toBe('Marin · Hiking by Transit')
    expect(resolveRoute('/trailheads/siesta-valley-de-laveaga-trail').metadata.title).toContain('Siesta Valley')
    expect(resolveRoute('/not-a-real-page').metadata.title).toBe('Page not found · Hiking by Transit')
  })

  it('prerenders destination pages and links them from associated trailheads', () => {
    expect(prerenderPaths).toContain('/destinations/pacific-crest-trail')
    expect(resolveRoute('/destinations/pacific-crest-trail').metadata.title).toContain('Pacific Crest Trail')
    const trailhead = renderToStaticMarkup(resolveRoute('/trailheads/castle-crags-state-park-pacific-crest-trail-soda-creek-trailhead').element)
    expect(trailhead).toContain('href="/destinations/castle-crags-state-park"')
    expect(trailhead).toContain('href="/destinations/pacific-crest-trail"')
  })

  it('makes an owning place canonical for its generated destination', () => {
    const destinationRoute = resolveRoute('/destinations/yosemite-national-park')
    expect(destinationRoute.metadata.canonicalPath).toBe('/places/yosemite-national-park')
    expect(renderToStaticMarkup(destinationRoute.element)).toContain('href="/places/yosemite-national-park"')
    const place = renderToStaticMarkup(resolveRoute('/places/yosemite-national-park').element)
    expect(place).toContain('Transit-accessible entrances')
    expect(place).toContain('/trailheads/yosemite-national-park-yosemite-valley')
  })

  it('links place guides to their canonical prerendered paths', () => {
    const peninsula = renderToStaticMarkup(resolveRoute('/places/peninsula').element)
    expect(peninsula).toContain('href="/peninsula/samcoast"')
    expect(prerenderPaths).toContain('/peninsula/samcoast')
    expect(resolveRoute('/peninsula/samcoast').metadata.title).toContain('SamCoast')
  })

  it('keeps post structured data serializable and canonical', () => {
    const postPath = prerenderPaths.find((pathname) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(pathname))
    expect(postPath).toBeDefined()
    const { metadata } = resolveRoute(postPath!)
    expect(metadata.structuredData).toMatchObject({ '@type': 'BlogPosting' })
    expect(() => JSON.stringify(metadata.structuredData)).not.toThrow()
  })

  it('selects relevant social images and falls back to the default preview', () => {
    expect(resolveRoute('/hikes/angel-island').metadata.socialImage).toBe('https://hikingbytransit.com/assets/angel-island.jpg')
    expect(resolveRoute('/peninsula/samcoast').metadata.socialImage).toBe('https://hikingbytransit.com/assets/samcoast.jpg')
    expect(resolveRoute('/trailheads').metadata.socialImage).toBe('https://hikingbytransit.com/assets/preview.png')
  })
})
