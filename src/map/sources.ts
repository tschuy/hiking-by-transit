import type { ConfigFile, MapDataSource, MapHike } from 'olmap'
import { hikeContent } from '../data/content'
import { enrichTrailheadKml } from '../data/trailheadCatalog'

const placeRoutes: MapHike[] = [
  {
    id: 'crosstown-trail', slug: 'crosstown-trail', title: 'Crosstown Trail',
    url: '/guides/san-francisco#the-crosstown-trail', gpx: 'crosstown.gpx',
    blurb: "Segments through San Francisco's hilltop parks.", length: 'Segments from 3–17mi',
    difficulty: 'easy', difficultyLabel: 'As easy or hard as you want it to be',
  },
  {
    id: 'double-cross-trail', slug: 'double-cross-trail', title: 'Double Cross Trail',
    url: '/guides/san-francisco#the-double-cross-trail', gpx: 'doublecross.gpx',
    blurb: 'A cross-city route from Fort Funston through the southwest hills.', length: 'Segments up to 14mi',
    difficulty: 'easy', difficultyLabel: 'As easy or hard as you want it to be',
  },
]

export const mapHikes: MapHike[] = [
  ...hikeContent.flatMap((hike): MapHike[] => hike.gpx ? [{
    id: hike.hike_id,
    slug: hike.slug,
    title: hike.title,
    url: `/hikes/${hike.slug}`,
    gpx: hike.gpx,
    blurb: hike.blurb,
    length: hike.length,
    difficulty: hike.difficulty,
    difficultyLabel: hike.difficulty_human ?? hike.difficulty,
  }] : []),
  ...placeRoutes,
]

export function createMapSources(config: ConfigFile, enabledLayers: ReadonlySet<string>): MapDataSource[] {
  const memberships = new Map<string, string[]>()
  Object.entries(config.feedGroups).forEach(([groupId, group]) => {
    group.members.forEach((feedId) => memberships.set(feedId, [...(memberships.get(feedId) ?? []), groupId]))
  })

  const transit: MapDataSource[] = Object.keys(config.feeds).map((feedId) => ({
    id: feedId,
    kind: 'geojson',
    role: 'transit',
    url: `/assets/geojson/${feedId}.geojson`,
    sourceUrl: config.feeds[feedId].gtfs.url,
    version: config.dataVersion,
    cachePolicy: 'memory',
    groupIds: memberships.get(feedId) ?? ['other'],
    visible: (memberships.get(feedId) ?? ['other']).some((groupId) => enabledLayers.has(groupId)),
  }))
  const trailheads: MapDataSource[] = (['hardcoded', 'generated'] as const).flatMap((kind) =>
    Object.keys(config.kmlGroups[kind]).map((layerId) => ({
      id: layerId,
      kind: 'kml' as const,
      role: 'trailhead' as const,
      url: `/assets/kml/${layerId}.kml`,
      load: async (signal) => {
        const response = await fetch(`/assets/kml/${layerId}.kml`, { signal })
        if (!response.ok) throw new Error(`HTTP ${response.status} for trailhead layer ${layerId}`)
        return enrichTrailheadKml(await response.text(), layerId)
      },
      version: config.dataVersion,
      cachePolicy: 'memory' as const,
      visible: enabledLayers.has(layerId),
    })),
  )
  const hikes: MapDataSource[] = mapHikes.map((hike) => ({
    id: `hike:${hike.id}`,
    kind: 'gpx',
    role: 'hike',
    url: `/assets/gpx/${hike.gpx}`,
    hikeId: hike.id,
    version: config.dataVersion,
    cachePolicy: 'memory',
    visible: true,
  }))
  const regionalResources: MapDataSource = {
    id: 'southern-california',
    kind: 'geojson',
    role: 'protected-area',
    url: '/assets/geojson/southern_california.geojson',
    version: config.dataVersion,
    cachePolicy: 'memory',
    visible: true,
    load: async (signal) => {
      const response = await fetch('/assets/geojson/southern_california.geojson', { signal })
      if (!response.ok) throw new Error(`HTTP ${response.status} for Southern California resources`)
      const collection = await response.json() as { features?: Array<{ properties?: Record<string, unknown> }> }
      collection.features?.forEach((feature) => {
        feature.properties = { ...feature.properties, name: 'Southern California' }
      })
      return collection
    },
  }

  return [regionalResources, ...transit, ...trailheads, ...hikes]
}
