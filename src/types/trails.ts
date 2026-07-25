export type Difficulty = 'Easy' | 'Moderate' | 'Hard'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Region {
  slug: string
  name: string
  description: string
  parentSlug?: Region['slug']
  kind: 'state' | 'macroregion' | 'subregion'
  featured: boolean
}

export interface Park {
  slug: string
  name: string
  regionSlug: Region['slug']
  description: string
  destination: boolean
}

export interface Place {
  slug: string
  name: string
  description: string
  parentSlug?: string
  kind: 'region' | 'park' | 'recreation-area' | 'forest'
  featured: boolean
}

export interface TransitRoute {
  agency: string
  routeName: string
  mode: 'Bus' | 'Rail' | 'Ferry' | 'Shuttle'
  serviceFrequency: string
  scheduleUrl: string
}

export interface Trailhead {
  slug: string
  name: string
  coordinates: Coordinates
  parkSlug: Park['slug']
  transitRoutes: TransitRoute[]
  stopName: string
  walkFromStopMinutes: number
  accessibilityNotes: string
  dataOnly: boolean
}

export interface Trail {
  slug: string
  name: string
  trailheadSlug: Trailhead['slug']
  parkSlug: Park['slug']
  regionSlug: Region['slug']
  summary: string
  distanceMiles: number
  elevationGainFeet: number
  difficulty: Difficulty
  estimatedDuration: string
  bestSeason: string
  seasonalNotice?: string
  featured: boolean
}

export interface Trip {
  slug: string
  trailSlug: Trail['slug']
  origin: string
  estimatedTransitTime: string
  transferSummary: string
  returnServiceWarning: string
  scheduleLastChecked: string
}
