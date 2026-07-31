export type CatalogBoolean = boolean | 'unknown'

export interface CatalogAccess {
  sourceFid: number
  id: string
  stopId: string | null
  stopName: string
  coordinates: [number, number]
  walkMinutes: number | null
  walkSource: string
  notes: string | null
  gtfsSource: string | null
  frequency: { weekday: number | null; saturday: number | null; sunday: number | null }
  routeIds: string[]
}

export interface CatalogRoute {
  gtfsSource: string
  id: string
  agencyId: string | null
  shortName: string | null
  longName: string | null
}

export interface CatalogTrailhead {
  id: string
  slug: string
  name: string
  entranceName: string | null
  destinationIds: string[]
  coordinates: [number, number]
  notes: string | null
  links: Array<{ href: string; label: string }>
  noteParts: Array<{ type: 'text'; text: string } | { type: 'link'; href: string; label: string } | { type: 'break' }>
  access: CatalogAccess[]
  hikeIds: string[]
  placeIds: string[]
  serviceDays: Array<'weekday' | 'saturday' | 'sunday'>
  reservationRequirement: CatalogBoolean
  seasonalService: CatalogBoolean
}

export interface CatalogDestination {
  id: string
  slug: string
  name: string
  placeId: string | null
  trailheadIds: string[]
}

export interface TrailheadCatalog {
  schemaVersion: '0.9'
  generatedAt: string
  source: { gpkgPath: string; gpkgSha256: string; contentPath: string; kmlSources: Array<{ path: string; sha256: string; publicPath: string }>; gitRevision: string }
  counts: { trailheads: number; accessRecords: number; hikes: number; places: number; destinations: number }
  trailheads: CatalogTrailhead[]
  destinations: CatalogDestination[]
  hikes: Array<{ id: string; slug: string; title: string; trailheadIds: string[]; placeIds: string[]; difficulty: string; lengthLabel: string; tags: string[]; gpx: string | null; image: string | null; blurb: string | null }>
  places: Array<{ id: string; slug: string; title: string; kind: string; parentId: string | null; blurb: string | null }>
  routes: CatalogRoute[]
}
