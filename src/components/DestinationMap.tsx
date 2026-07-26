import { useEffect, useRef, useState } from 'react'
import type { CatalogDestination, CatalogTrailhead } from '../types/catalog'

function webMercator([longitude, latitude]: [number, number]): [number, number] {
  const radius = 6_378_137
  const boundedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude))
  return [
    radius * longitude * Math.PI / 180,
    radius * Math.log(Math.tan(Math.PI / 4 + boundedLatitude * Math.PI / 360)),
  ]
}

export function DestinationMap({ destination, trailheads }: { destination: CatalogDestination; trailheads: CatalogTrailhead[] }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const target = targetRef.current
    if (!target || trailheads.length === 0) return
    const abortController = new AbortController()
    let destroy: (() => void) | undefined

    void (async () => {
      try {
        const { createTrailheadMap, validateConfig } = await import('olmap')
        const response = await fetch('/assets/data/config.json', { signal: abortController.signal })
        if (!response.ok) throw new Error(`Configuration request returned HTTP ${response.status}`)
        const config = validateConfig(await response.json())
        if (abortController.signal.aborted) return
        const features = trailheads.map((trailhead) => ({
          type: 'Feature',
          id: trailhead.id,
          geometry: { type: 'Point', coordinates: trailhead.coordinates },
          properties: { trailhead_id: trailhead.id, slug: trailhead.slug, name: trailhead.name, marker_label: trailhead.entranceName ?? trailhead.name, marker_color: '#c67b59' },
        }))
        const center = webMercator(trailheads[0].coordinates)
        const controller = createTrailheadMap({
          target,
          config,
          dataSources: [{ id: 'destination-trailheads', kind: 'geojson', role: 'trailhead', load: async () => ({ type: 'FeatureCollection', features }), clustering: false }],
          initialView: { center, zoom: 11 },
          tileSource: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'Map data © OpenStreetMap contributors' },
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        })
        destroy = () => controller.destroy()
        await controller.ready
        if (abortController.signal.aborted) return
        const points = trailheads.map((trailhead) => webMercator(trailhead.coordinates))
        const xs = points.map(([x]) => x)
        const ys = points.map(([, y]) => y)
        controller.fitToExtent([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], { padding: [55, 55, 55, 55], maxZoom: 14 })
      } catch (reason) {
        if (!abortController.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason))
      }
    })()

    return () => {
      abortController.abort()
      destroy?.()
    }
  }, [trailheads])

  return <section className="trailhead-access-map olmap-root" aria-labelledby="destination-map-title">
    <div className="filter-heading"><div><p className="eyebrow">Access map</p><h2 id="destination-map-title">Transit-accessible entrances</h2></div><span>{trailheads.length} trailhead{trailheads.length === 1 ? '' : 's'}</span></div>
    <div ref={targetRef} className="trailhead-access-map-target olmap-map" role="region" aria-label={`Map of trailheads serving ${destination.name}`} />
    {error && <p className="map-error" role="alert">The destination map could not be loaded. {error}</p>}
  </section>
}
