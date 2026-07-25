import { useEffect } from 'react'
import { hikeContent } from '../data/content'

interface MapHike {
  title: string
  url: string
  gpx: string
  blurb: string
  length: string
  difficultyhuman: string
  difficulty: string
}

const mappedHikes: MapHike[] = hikeContent.flatMap((hike) => hike.gpx ? [{
  title: hike.title,
  url: `/hikes/${hike.slug}`,
  gpx: hike.gpx,
  blurb: hike.blurb ?? '',
  length: hike.length,
  difficultyhuman: hike.difficulty_human ?? hike.difficulty,
  difficulty: hike.difficulty,
}] : [])

const placeRoutes: MapHike[] = [
  {
    title: 'Crosstown Trail',
    url: '/places/san-francisco#the-crosstown-trail',
    gpx: 'crosstown.gpx',
    blurb: "The premier trail featuring segments through all of San Francisco's best hilltop parks.",
    length: 'Segments from 3–17mi',
    difficultyhuman: 'As easy or hard as you want it to be',
    difficulty: 'easy',
  },
  {
    title: 'Double Cross Trail',
    url: '/places/san-francisco#the-double-cross-trail',
    gpx: 'doublecross.gpx',
    blurb: "From quiet windswept Fort Funston to the dense inner city via the city's lesser-known southwest neighborhoods and hills.",
    length: 'Segments up to 14mi',
    difficultyhuman: 'As easy or hard as you want it to be',
    difficulty: 'easy',
  },
]

interface MapCheckbox {
  name: string
  label: string
  checked?: boolean
}

const trailheadLayers: MapCheckbox[] = [
  { name: 'bus', label: 'Bus & light rail', checked: true },
  { name: 'bus-far', label: 'Bus & light rail (15+ min walk)', checked: true },
  { name: 'bus-weekday-only', label: 'Bus (weekday only)', checked: true },
  { name: 'rail', label: 'Rail & ferry', checked: true },
  { name: 'rail-far', label: 'Rail & ferry (20+ min walk)', checked: true },
  { name: 'shuttles', label: 'Park shuttles', checked: true },
  { name: 'microtransit', label: 'Microtransit', checked: true },
  { name: 'call-ahead', label: 'Call-ahead service', checked: true },
]

const transitLayers: MapCheckbox[] = [
  { name: 'bayarea', label: 'Bay Area' },
  { name: 'tahoe', label: 'Tahoe' },
  { name: 'centralcoast', label: 'Central Coast' },
  { name: 'amtrak', label: 'Amtrak / Gold Runner' },
  { name: 'sacrt', label: 'Sacramento' },
  { name: 'central-valley', label: 'Central Valley' },
  { name: 'other', label: 'Other agencies' },
]

function CheckboxList({ items }: { items: MapCheckbox[] }) {
  return <>{items.map((item) => <label className="map-checkbox" key={item.name}><input type="checkbox" name={item.name} defaultChecked={item.checked} /><span>{item.label}</span></label>)}</>
}

interface TrailheadMapProps {
  center?: { longitude: number; latitude: number; zoom: number }
  scope?: 'statewide' | 'tahoe'
}

export function TrailheadMap({ center, scope = 'statewide' }: TrailheadMapProps) {
  const isTahoe = scope === 'tahoe'
  const displayedTransitLayers = isTahoe ? transitLayers.filter((layer) => layer.name === 'tahoe').map((layer) => ({ ...layer, checked: true })) : transitLayers
  useEffect(() => {
    const mapWindow = window as Window & { hikes_with_gpx?: MapHike[] }
    mapWindow.hikes_with_gpx = [...mappedHikes, ...placeRoutes]
    const filterContainer = document.getElementById('filter')
    const inputs = Array.from(filterContainer?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])
    const selectedLayers = new Set(new URLSearchParams(window.location.search).getAll('layer'))

    if (selectedLayers.size > 0) {
      inputs.forEach((input) => { input.checked = selectedLayers.has(input.name) })
    }

    const applyInitialLayers = () => {
      inputs.forEach((input) => input.dispatchEvent(new Event('change', { bubbles: true })))
    }

    const saveSelectedLayers = () => {
      const params = new URLSearchParams(window.location.search)
      params.delete('layer')
      inputs.filter((input) => input.checked).forEach((input) => params.append('layer', input.name))
      const query = params.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    }

    filterContainer?.addEventListener('change', saveSelectedLayers)

    if (!document.querySelector('link[data-trailhead-map-styles]')) {
      const stylesheet = document.createElement('link')
      stylesheet.rel = 'stylesheet'
      stylesheet.href = '/map/olmap.css'
      stylesheet.dataset.trailheadMapStyles = 'true'
      document.head.append(stylesheet)
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-trailhead-map-bundle]')
    if (!script) {
      script = document.createElement('script')
      script.type = 'module'
      script.src = '/map/olmap.js'
      script.dataset.trailheadMapBundle = 'true'
      const newScript = script
      script.addEventListener('load', () => { newScript.dataset.loaded = 'true' })
      document.body.append(script)
    }

    if (script.dataset.loaded === 'true') applyInitialLayers()
    else script.addEventListener('load', applyInitialLayers, { once: true })

    return () => {
      filterContainer?.removeEventListener('change', saveSelectedLayers)
      script?.removeEventListener('load', applyInitialLayers)
    }
  }, [])

  return (
    <div className="map-layout">
      <div className="map-stage">
        <div id="ol-map" data-lon={center?.longitude} data-lat={center?.latitude} data-zoom={center?.zoom} aria-label={isTahoe ? 'Interactive map of transit-accessible trailheads around Lake Tahoe' : 'Interactive map of transit-accessible trailheads'}>
          <div id="info" />
        </div>

        <div id="popup" className="ol-popup">
          <a href="#map-end" id="popup-closer" className="ol-popup-closer" aria-label="Close map popup" />
          <div id="popup-content" />
          <div className="popup-actions">
            <a href="#map-end" id="popup-directions-link" className="ol-popup-link" target="_blank" rel="noreferrer">Open in Maps <span aria-hidden="true">↗</span></a>
            <a href="#map-end" id="popup-hike-link" className="ol-popup-link">Read hike guide <span aria-hidden="true">→</span></a>
            <a href="#map-end" id="popup-alltrails-link" className="ol-popup-link" target="_blank" rel="noreferrer">Open in AllTrails <span aria-hidden="true">↗</span></a>
          </div>
        </div>

        <p className="map-instruction mobile-map-instruction">Use two fingers to pan the map.</p>
        <p className="map-instruction desktop-map-instruction">Drag to pan. Hold <kbd>Ctrl</kbd> or <kbd>⌘</kbd> while scrolling to zoom.</p>
      </div>

      <aside id="filter" className="map-filters" aria-label="Map filters">
        <div className="filter-heading"><div><p className="eyebrow">Map layers</p><h2>Filter the map</h2></div><span>Changes apply instantly</span></div>
        <div className={`filter-columns${isTahoe ? ' filter-columns-scoped' : ''}`}>
          {isTahoe ? <form id="filter-form" autoComplete="off" /> : <fieldset>
            <legend>Trailhead access</legend>
            <form id="filter-form" autoComplete="off"><CheckboxList items={trailheadLayers} /></form>
          </fieldset>}
          <fieldset>
            <legend>Transit networks</legend>
            <form id="filter-layers-form" autoComplete="off">
              <label className="map-checkbox"><input type="checkbox" name="cpad" /><span>Protected areas (CPAD)</span></label>
              <CheckboxList items={displayedTransitLayers} />
            </form>
          </fieldset>
        </div>
      </aside>
      <span id="map-end" />
    </div>
  )
}
