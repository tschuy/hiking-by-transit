import { describe, expect, it } from 'vitest'
import type { CatalogAccess } from '../types/catalog'
import { formatServiceFrequency } from './transitFrequency'

function access(weekday: number | null, saturday: number | null, sunday: number | null): CatalogAccess {
  return {
    sourceFid: 1, id: 'access', stopId: 'stop', stopName: 'Stop', coordinates: [-122, 38],
    walkMinutes: 1, walkSource: 'routed', notes: null, gtfsSource: null,
    frequency: { weekday, saturday, sunday }, routeIds: [],
  }
}

describe('transit frequency descriptions', () => {
  it('uses the same label when service is alike all week', () => {
    expect(formatServiceFrequency(access(24, 24, 24))).toEqual(['7 days a week: About hourly'])
  })

  it('combines matching weekend service', () => {
    expect(formatServiceFrequency(access(60, 6, 6))).toEqual(['Weekday: Every 20–30 minutes', 'Weekend: 6 trips a day'])
  })

  it('omits days without service and retains low positive averages', () => {
    expect(formatServiceFrequency(access(.4, null, 2))).toEqual(['Weekday: 1 trip a day', 'Sunday: 2 trips a day'])
  })
})
