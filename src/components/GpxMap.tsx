import { useEffect, useId, useRef, useState } from 'react'
import type { ConfigFile, TrailheadMapController, TrailheadMapEvent } from 'olmap'
import 'olmap/styles/openlayers.css'
import { ElevationProfile } from './ElevationProfile'
import { nearestRouteSample, parseGpx, type ParsedRoute } from '../map/gpx'

const routeConfig: ConfigFile = {
  schemaVersion: 'legacy-1',
  dataVersion: 'hike-route',
  feeds: {},
  feedGroups: {},
  kmlGroups: { hardcoded: {}, generated: {} },
}

export function GpxMap({ file, title, compact = false }: { file: string; title: string; compact?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<TrailheadMapController>(null)
  const mapId = useId()
  const [status, setStatus] = useState('Loading route map…')
  const [route, setRoute] = useState<ParsedRoute>()
  const [activeIndex, setActiveIndex] = useState<number>()
  const fileUrl = file.split('/').map(encodeURIComponent).join('/')

  useEffect(() => {
    const target = mapRef.current
    if (!target) return
    const abortController = new AbortController()
    let controller: TrailheadMapController | undefined

    void (async () => {
      try {
        const [response, olmap] = await Promise.all([
          fetch(`/assets/gpx/${fileUrl}`, { signal: abortController.signal }),
          import('olmap'),
        ])
        if (!response.ok) throw new Error(`Route request returned HTTP ${response.status}`)
        const gpx = await response.text()
        const parsed = parseGpx(gpx)
        if (abortController.signal.aborted) return
        setRoute(parsed)
        const handleEvent = (event: TrailheadMapEvent) => {
          if (event.type === 'route-position-change') {
            setActiveIndex(event.coordinate ? nearestRouteSample(parsed.samples, event.coordinate) : undefined)
          }
          if (event.type === 'layer-progress' && event.layer.sourceId === 'route' && event.layer.status === 'ready') {
            setStatus('Route loaded. Use the map and elevation profile to inspect the hike.')
            requestAnimationFrame(() => {
              controller?.updateSize()
              controller?.fitToExtent(parsed.extent, { padding: [32, 32, 32, 32], maxZoom: 16 })
            })
          }
          if (event.type === 'error' && event.error.sourceId === 'route') setStatus('The route could not be displayed. The GPX download is still available.')
        }
        controller = olmap.createTrailheadMap({
          target,
          config: routeConfig,
          dataSources: [{
            id: 'route',
            kind: 'gpx',
            role: 'hike',
            hikeId: 'route',
            visible: true,
            load: async () => gpx,
          }],
          hikes: [{ id: 'route', slug: file, title, gpx: file, url: window.location.pathname }],
          initialView: { extent: parsed.extent },
          tileSource: {
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Map data © OpenStreetMap contributors',
          },
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onEvent: handleEvent,
        })
        controllerRef.current = controller
        await controller.ready
        requestAnimationFrame(() => {
          controller?.updateSize()
          controller?.fitToExtent(parsed.extent, { padding: [32, 32, 32, 32], maxZoom: 16 })
        })
      } catch (error) {
        if (!abortController.signal.aborted) {
          setStatus(error instanceof Error ? `The route could not be loaded: ${error.message}` : 'The route could not be loaded.')
        }
      }
    })()

    return () => {
      abortController.abort()
      controller?.destroy()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [file, fileUrl, title])

  const inspectRoute = (index?: number) => {
    setActiveIndex(index)
    controllerRef.current?.setRoutePosition(index === undefined ? undefined : route?.samples[index]?.mapCoordinate)
  }

  return <section className={`hike-map-section olmap-root${compact ? ' hike-map-section-compact' : ''}`} aria-label={compact ? `${title} route map and elevation` : undefined} aria-labelledby={compact ? undefined : `${mapId}-title`}>
    {!compact && <div className="section-heading compact-heading"><div><h2 id={`${mapId}-title`}>{title} map</h2></div><a href={`/assets/gpx/${fileUrl}`} download>Download GPX</a></div>}
    <div className="hike-gpx-map olmap-map" ref={mapRef} aria-label={`Interactive GPX route map for ${title}`} role="region" />
    <p className="map-noscript">The interactive route map and elevation profile require JavaScript. The GPX file remains available to download.</p>
    {route && <ElevationProfile route={route} activeIndex={activeIndex} onActiveIndex={inspectRoute} />}
    <p className={`field-note${compact ? ' visually-hidden' : ''}`} role="status">{status}</p>
  </section>
}
