import { describe, expect, it } from 'vitest'
import type { CatalogAccess } from '../types/catalog'
import { formatAccessRoutes, formatAccessRoutesUsing } from './transitRouteNames'

function access(routeIds: string[], overrides: Partial<CatalogAccess> = {}): CatalogAccess {
  return {
    sourceFid: 1, id: 'access', stopId: 'stop', stopName: 'Stop', coordinates: [-122, 38],
    walkMinutes: 1, walkSource: 'routed', notes: null,
    gtfsSource: 'http://api.511.org/transit/datafeeds',
    frequency: { weekday: 1, saturday: 1, sunday: 1 }, routeIds, ...overrides,
  }
}

describe('transit route display names', () => {
  it('uses configured agency short names and collapses directional variants', () => {
    expect(formatAccessRoutes(access(['BA:Blue-N', 'BA:Blue-S', 'BA:Green-N', 'BA:Green-S', 'BA:Orange-N', 'BA:Orange-S']))).toEqual([
      'BART Blue', 'BART Green', 'BART Orange',
    ])
    expect(formatAccessRoutes(access(['AC:36']))).toEqual(['AC Transit 36'])
  })

  it('uses a route long name when an opaque route ID has no short name', () => {
    expect(formatAccessRoutesUsing(access(['582'], {
      gtfsSource: 'https://files.mobilitydatabase.org/mdb-2394/mdb-2394-202512250133/mdb-2394-202512250133.zip',
    }), [{ gtfsSource: 'https://files.mobilitydatabase.org/mdb-2394/mdb-2394-202512250133/mdb-2394-202512250133.zip', id: '582', agencyId: '114', shortName: null, longName: 'Mammoth Lakes HWY 120E/395' }])).toEqual(['YARTS Mammoth Lakes HWY 120E/395'])
  })

  it('prefers a route short name to an opaque route ID', () => {
    expect(formatAccessRoutesUsing(access(['2031'], {
      gtfsSource: 'https://data.trilliumtransit.com/gtfs/laketransit-ca-us/laketransit-ca-us.zip',
    }), [{ gtfsSource: 'https://data.trilliumtransit.com/gtfs/laketransit-ca-us/laketransit-ca-us.zip', id: '2031', agencyId: '7', shortName: '2', longName: 'Highway 175, Kit’s Corner to Middletown' }])).toEqual(['Lake Transit 2'])
  })
})
