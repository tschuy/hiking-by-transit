import { useEffect, useId, useRef, useState } from 'react'

declare global {
  interface Window { L?: LeafletApi }
}

interface LeafletMap { remove: () => void }
interface ElevationControl { addTo: (map: LeafletMap) => ElevationControl; on: (event: string, callback: () => void) => void; load: (url: string) => void; remove: () => void }
interface LeafletApi {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap
  control: { elevation: (options: Record<string, unknown>) => ElevationControl }
}

const resources = {
  leafletCss: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  elevationCss: 'https://unpkg.com/@raruto/leaflet-elevation@2.2.8/dist/leaflet-elevation.min.css',
  leaflet: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  leafletUi: 'https://unpkg.com/leaflet-ui@0.5.9/dist/leaflet-ui.js',
  elevation: 'https://unpkg.com/@raruto/leaflet-elevation@2.2.8/dist/leaflet-elevation.min.js',
}

function stylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.append(link)
}

function script(src: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing?.dataset.loaded === 'true') return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const element = existing ?? document.createElement('script')
    element.addEventListener('load', () => { element.dataset.loaded = 'true'; resolve() }, { once: true })
    element.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true })
    if (!existing) { element.src = src; document.head.append(element) }
  })
}

let libraryPromise: Promise<void> | undefined
function loadLibrary() {
  if (window.L?.control?.elevation) return Promise.resolve()
  stylesheet(resources.leafletCss)
  stylesheet(resources.elevationCss)
  libraryPromise ??= script(resources.leaflet)
    .then(() => script(resources.leafletUi))
    .then(() => script(resources.elevation))
  return libraryPromise
}

export function GpxMap({ file, title, compact = false }: { file: string; title: string; compact?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapId = useId()
  const [status, setStatus] = useState('Loading route map…')
  const fileUrl = file.split('/').map(encodeURIComponent).join('/')

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | undefined
    let elevation: ElevationControl | undefined
    loadLibrary().then(() => {
      if (cancelled || !mapRef.current || !window.L) return
      const L = window.L
      map = L.map(mapRef.current, { fullscreenControl: false, resizerControl: true, preferCanvas: true })
      elevation = L.control.elevation({
        theme: 'lightblue-theme', collapsed: true, autohide: false, autofitBounds: true,
        position: 'bottomleft', detached: true, summary: 'inline', imperial: true,
        slope: 'disabled', speed: false, acceleration: false, time: 'summary', legend: true,
        followMarker: true, almostOver: true, distanceMarkers: false, hotline: false,
      }).addTo(map)
      elevation.on('eledata_loaded', () => { if (!cancelled) setStatus('Route loaded. Use the map and elevation chart to inspect the hike.') })
      elevation.load(`/assets/gpx/${fileUrl}`)
    }).catch(() => { if (!cancelled) setStatus('The route map could not be loaded. The GPX download is still available.') })
    return () => { cancelled = true; elevation?.remove(); map?.remove() }
  }, [file, fileUrl])

  return (
    <section className={`hike-map-section${compact ? ' hike-map-section-compact' : ''}`} aria-label={compact ? `${title} route map and elevation` : undefined} aria-labelledby={compact ? undefined : `${mapId}-title`}>
      {!compact && <div className="section-heading compact-heading"><div><p className="eyebrow">Route and elevation</p><h2 id={`${mapId}-title`}>{title} map</h2></div><a href={`/assets/gpx/${fileUrl}`} download>Download GPX</a></div>}
      <div className="hike-gpx-map" ref={mapRef} aria-label={`Interactive GPX route map for ${title}`} />
      <p className={`field-note${compact ? ' visually-hidden' : ''}`} role="status">{status}</p>
    </section>
  )
}
