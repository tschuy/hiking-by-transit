export interface MapScopePreset {
  center: { longitude: number; latitude: number; zoom: number }
  transitGroups: string[]
  defaultTransitGroups?: string[]
}

export const mapScopePresets: Record<string, MapScopePreset> = {
  california: { center: { longitude: -119.5, latitude: 37.2, zoom: 6 }, transitGroups: [] },
  'bay-area': { center: { longitude: -122.15, latitude: 37.78, zoom: 8.5 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  'east-bay': { center: { longitude: -122.12, latitude: 37.82, zoom: 10 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  marin: { center: { longitude: -122.67, latitude: 38.04, zoom: 10 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  peninsula: { center: { longitude: -122.35, latitude: 37.52, zoom: 10 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  'san-francisco': { center: { longitude: -122.44, latitude: 37.76, zoom: 12 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  'south-bay': { center: { longitude: -121.88, latitude: 37.25, zoom: 10 }, transitGroups: ['bayarea'], defaultTransitGroups: [] },
  tahoe: { center: { longitude: -120.0326, latitude: 39.1046, zoom: 11 }, transitGroups: ['tahoe'] },
  'channel-islands-national-park': { center: { longitude: -119.72, latitude: 34.02, zoom: 9 }, transitGroups: ['other'] },
  'yosemite-national-park': { center: { longitude: -119.58, latitude: 37.75, zoom: 10 }, transitGroups: ['other'] },
}
