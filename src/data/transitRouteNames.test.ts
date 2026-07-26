import { describe, expect, it } from 'vitest'
import type { CatalogAccess } from '../types/catalog'
import { formatAccessRoutes } from './transitRouteNames'

function access(routeIds: string[]): CatalogAccess {
  return {
    sourceFid: 1, id: 'access', stopId: 'stop', stopName: 'Stop', coordinates: [-122, 38],
    walkMinutes: 1, walkSource: 'routed', notes: null,
    gtfsSource: 'http://api.511.org/transit/datafeeds',
    frequency: { weekday: 1, saturday: 1, sunday: 1 }, routeIds,
  }
}

describe('transit route display names', () => {
  it('uses configured agency short names and collapses directional variants', () => {
    expect(formatAccessRoutes(access(['BA:Blue-N', 'BA:Blue-S', 'BA:Green-N', 'BA:Green-S', 'BA:Orange-N', 'BA:Orange-S']))).toEqual([
      'BART Blue', 'BART Green', 'BART Orange',
    ])
    expect(formatAccessRoutes(access(['AC:36']))).toEqual(['AC Transit 36'])
  })
})
