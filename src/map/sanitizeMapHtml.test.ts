import { describe, expect, it } from 'vitest'
import { sanitizeMapHtml } from './sanitizeMapHtml'

describe('map HTML sanitizer', () => {
  it('retains safe formatting and strips executable markup', () => {
    const output = sanitizeMapHtml('<p>Hello <strong>trail</strong><script>alert(1)</script></p>')
    expect(output).toBe('<p>Hello <strong>trail</strong>alert(1)</p>')
  })

  it('removes unsafe URLs and secures external links', () => {
    expect(sanitizeMapHtml('<a href="javascript:alert(1)">bad</a>')).toBe('<a>bad</a>')
    expect(sanitizeMapHtml('<a href="https://example.com/path">good</a>')).toContain('rel="noreferrer"')
    expect(sanitizeMapHtml('<a href="/hikes/example">local</a>')).toBe('<a href="/hikes/example">local</a>')
  })
})
