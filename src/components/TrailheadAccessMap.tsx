import { useEffect, useRef, useState } from 'react'
import type { ConfigFile } from 'olmap'
import { googleMapsUrl } from '../map/googleMaps'
import type { CatalogTrailhead } from '../types/catalog'

const categoryColors: Record<string, string> = {
  bus: '#0288d1', rail: '#f57c00', ferry: '#f57c00', shuttle: '#000000',
  microtransit: '#757575', 'call-ahead': '#bdbdbd',
}

function transitCategory(config: ConfigFile, gtfsSource: string | null, routeIds: string[]): string {
  const feed = Object.values(config.feeds).find((candidate) => candidate.gtfs.url === gtfsSource)
  if (!feed) return 'bus'
  for (const routeId of routeIds) {
    const agencyPrefix = routeId.includes(':') ? routeId.split(':')[0] : undefined
    if (agencyPrefix && feed.agencies[agencyPrefix]) return feed.agencies[agencyPrefix].type
    const agency = Object.values(feed.agencies).find((candidate) => Object.keys(candidate.routes ?? {}).some((id) => id === routeId || id === routeId.replace(/^0+/, '')))
    if (agency) return agency.type
  }
  const types = [...new Set(Object.values(feed.agencies).map((agency) => agency.type))]
  return types.length === 1 ? types[0] : 'bus'
}

function webMercator([longitude, latitude]: [number, number]): [number, number] {
  const radius = 6_378_137
  const boundedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude))
  return [
    radius * longitude * Math.PI / 180,
    radius * Math.log(Math.tan(Math.PI / 4 + boundedLatitude * Math.PI / 360)),
  ]
}

export function TrailheadAccessMap({ trailhead }: { trailhead: CatalogTrailhead }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    const abortController = new AbortController()
    let destroy: (() => void) | undefined

    void (async () => {
      try {
        const { createTrailheadMap, validateConfig } = await import('olmap')
        const response = await fetch('/assets/data/config.json', { signal: abortController.signal })
        if (!response.ok) throw new Error(`Configuration request returned HTTP ${response.status}`)
        const config = validateConfig(await response.json())
        if (abortController.signal.aborted) return

        const trailheadFeature = {
          type: 'Feature',
          id: trailhead.id,
          geometry: { type: 'Point', coordinates: trailhead.coordinates },
          properties: { trailhead_id: trailhead.id, name: trailhead.name, marker_color: '#c5522f', marker_label: trailhead.name },
        }
        const stopFeatures = trailhead.access.map((access) => {
          const category = transitCategory(config, access.gtfsSource, access.routeIds)
          return {
            type: 'Feature',
            id: `${access.id}:${access.sourceFid}`,
            geometry: { type: 'Point', coordinates: access.coordinates },
            properties: {
              stop_id: access.stopId ?? `${access.id}:${access.sourceFid}`,
              stop_name: access.stopName,
              marker_label: access.stopName,
              marker_color: categoryColors[category] ?? categoryColors.bus,
              transit_category: category,
            },
          }
        })
        const controller = createTrailheadMap({
          target,
          config,
          dataSources: [
            { id: 'detail-trailhead', kind: 'geojson', role: 'trailhead', load: async () => ({ type: 'FeatureCollection', features: [trailheadFeature] }), clustering: false },
            { id: 'detail-stops', kind: 'geojson', role: 'transit', visible: true, pointMarkers: true, load: async () => ({ type: 'FeatureCollection', features: stopFeatures }) },
          ],
          initialView: { center: webMercator(trailhead.coordinates), zoom: 14 },
          tileSource: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'Map data © OpenStreetMap contributors' },
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        })
        destroy = () => controller.destroy()
        await controller.ready
        if (abortController.signal.aborted) return
        const points = [trailhead.coordinates, ...trailhead.access.map((access) => access.coordinates)].map(webMercator)
        if (points.length > 1) {
          const xs = points.map(([x]) => x)
          const ys = points.map(([, y]) => y)
          controller.fitToExtent([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], { padding: [55, 55, 55, 55], maxZoom: 16 })
        }
      } catch (reason) {
        if (!abortController.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason))
      }
    })()

    return () => {
      abortController.abort()
      destroy?.()
    }
  }, [trailhead])

  return <section className="trailhead-access-map olmap-root" aria-labelledby="trailhead-access-map-title">
    <div className="filter-heading"><div><h2 id="trailhead-access-map-title">Trailhead and transit stops</h2></div><a href={googleMapsUrl(trailhead.coordinates)} target="_blank" rel="noreferrer">Open trailhead in Google Maps ↗</a></div>
    <div ref={targetRef} className="trailhead-access-map-target olmap-map" role="region" aria-label={`Map of ${trailhead.name} and its associated transit stops`} />
    {error && <p className="map-error" role="alert">The access map could not be loaded. {error}</p>}
  </section>
}
