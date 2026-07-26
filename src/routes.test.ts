import { describe, expect, it } from 'vitest'
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
    expect(resolveRoute('/trailheads/inspiration-point').metadata.title).toContain('Inspiration Point')
    expect(resolveRoute('/not-a-real-page').metadata.title).toBe('Page not found · Hiking by Transit')
  })

  it('keeps post structured data serializable and canonical', () => {
    const postPath = prerenderPaths.find((pathname) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(pathname))
    expect(postPath).toBeDefined()
    const { metadata } = resolveRoute(postPath!)
    expect(metadata.structuredData).toMatchObject({ '@type': 'BlogPosting' })
    expect(() => JSON.stringify(metadata.structuredData)).not.toThrow()
  })
})
