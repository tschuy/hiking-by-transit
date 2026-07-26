import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { MapAction, MapFeatureDetails, VisibleFeatureState } from 'olmap'
import 'olmap/styles/openlayers.css'
import { useTrailheadMap } from '../hooks/useTrailheadMap'
import { sanitizeMapHtml } from '../map/sanitizeMapHtml'
import { catalogTrailheadForFeature, getCatalogHike, trailheadCatalog } from '../data/trailheadCatalog'
import type { CatalogTrailhead } from '../types/catalog'
import { formatAccessRoutes } from '../data/transitRouteNames'

interface MapCheckbox { name: string; label: string; color?: string }

const trailheadLayers: MapCheckbox[] = [
  { name: 'bus', label: 'Bus & light rail', color: '#0288d1' },
  { name: 'bus-far', label: 'Bus & light rail (15+ min walk)', color: '#0097a7' },
  { name: 'bus-weekday-only', label: 'Bus (weekday only)', color: '#1a237e' },
  { name: 'rail', label: 'Rail & ferry', color: '#f57c00' },
  { name: 'rail-far', label: 'Rail & ferry (20+ min walk)', color: '#e65100' },
  { name: 'shuttles', label: 'Park shuttles', color: '#000000' },
  { name: 'microtransit', label: 'Microtransit', color: '#757575' },
  { name: 'call-ahead', label: 'Call-ahead service', color: '#bdbdbd' },
]

const trailheadGroups = [
  { label: 'Bus access', members: ['bus', 'bus-far', 'bus-weekday-only'] },
  { label: 'Rail and ferry access', members: ['rail', 'rail-far'] },
  { label: 'Flexible and special service', members: ['shuttles', 'microtransit', 'call-ahead'] },
]
const trailheadLayerById = new Map(trailheadLayers.map((layer) => [layer.name, layer]))

const transitLayers: MapCheckbox[] = [
  { name: 'bayarea', label: 'Bay Area' }, { name: 'tahoe', label: 'Tahoe' },
  { name: 'centralcoast', label: 'Central Coast' }, { name: 'amtrak', label: 'Amtrak / Gold Runner' },
  { name: 'sacrt', label: 'Sacramento' }, { name: 'central-valley', label: 'Central Valley' },
  { name: 'other', label: 'Other agencies' },
]

interface TrailheadMapProps {
  center?: { longitude: number; latitude: number; zoom: number }
  scope?: string
  transitGroups?: string[]
  defaultTransitGroups?: string[]
  label?: string
}

function ActionLink({ action }: { action: MapAction }) {
  const external = action.url.startsWith('http')
  return <a className={`map-action map-action-${action.kind}`} href={action.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{action.label} <span aria-hidden="true">{external ? '↗' : '→'}</span></a>
}

function RichDescription({ html }: { html: string }) {
  const sanitized = useMemo(() => sanitizeMapHtml(html), [html])
  return <div className="map-rich-description" dangerouslySetInnerHTML={{ __html: sanitized }} />
}

function MiniMap({ feature }: { feature: MapFeatureDetails }) {
  if (!feature.coordinate) return null
  const radius = 6_378_137
  const longitude = feature.coordinate[0] / radius * 180 / Math.PI
  const latitude = (2 * Math.atan(Math.exp(feature.coordinate[1] / radius)) - Math.PI / 2) * 180 / Math.PI
  const delta = .012
  const params = new URLSearchParams({
    bbox: `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`,
    marker: `${latitude},${longitude}`,
    layer: 'mapnik',
  })
  return <iframe className="map-mini-map" title={`Small map showing ${feature.name}`} loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?${params}`} />
}

function CatalogDetails({ trailhead }: { trailhead: CatalogTrailhead }) {
  return <div className="map-catalog-details">
    {trailhead.notes && <p>{trailhead.notes}</p>}
    {trailhead.access.map((access) => {
      const routes = formatAccessRoutes(access)
      return <div className="map-catalog-stop" key={`${access.id}-${access.sourceFid}`}><strong>Stop: {access.stopName}</strong><p>{access.walkMinutes === null ? 'See access notes' : `${Math.round(access.walkMinutes)} min walk`}</p>{routes.length > 0 && <p>Served by {routes.join(', ')}</p>}{access.notes && <p>{access.notes}</p>}</div>
    })}
    {trailhead.hikeIds.map(getCatalogHike).map((hike) => hike && <p key={hike.id}><a href={`/hikes/${hike.slug}`}>Read hike guide: {hike.title} →</a></p>)}
  </div>
}

function FeatureDetails({ feature, includeMiniMap = false }: { feature: MapFeatureDetails; includeMiniMap?: boolean }) {
  const trailhead = feature.kind === 'trailhead' ? catalogTrailheadForFeature(feature.id) : undefined
  return <div className={`map-feature-details map-feature-details-${feature.kind}`}>
    {includeMiniMap && <MiniMap feature={feature} />}
    {trailhead ? <CatalogDetails trailhead={trailhead} /> : feature.description && <RichDescription html={feature.description} />}
    {feature.kind === 'cluster' && <p>This group contains {feature.clusterSize} trailheads of the same access type. Select it again to zoom in.</p>}
    {feature.actions.length > 0 && <nav className="popup-actions" aria-label="Selection actions">{feature.actions.map((action) => <ActionLink action={action} key={`${action.kind}-${action.url}`} />)}</nav>}
    {trailhead && <a className="map-action" href={`/trailheads/${trailhead.slug}`}>View trailhead details <span aria-hidden="true">→</span></a>}
  </div>
}

function SelectionPanel({ feature, active, onClose }: { feature: MapFeatureDetails; active: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!active) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })
  }, [active, feature.id])
  const close = () => {
    const returnFocus = returnFocusRef.current
    onClose()
    requestAnimationFrame(() => returnFocus?.focus({ preventScroll: true }))
  }
  return <aside className={`map-selection map-selection-${feature.kind}`} role="dialog" aria-modal="false" aria-label={`Details for ${feature.name}`} onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
    <button ref={closeRef} className="map-selection-close" type="button" onClick={close} aria-label="Close map details">×</button>
    <p className="eyebrow">{feature.kind === 'cluster' ? `${feature.clusterSize} nearby trailheads` : 'Map selection'}</p>
    <h2>{feature.name}</h2>
    <FeatureDetails feature={feature} />
  </aside>
}

function ResultList({ features, selected, onSelect }: { features: VisibleFeatureState[]; selected?: MapFeatureDetails; onSelect: (id: string) => void }) {
  const [page, setPage] = useState(0)
  const pageSize = 25
  const pageCount = Math.max(1, Math.ceil(features.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const rows = features.slice(safePage * pageSize, (safePage + 1) * pageSize)
  if (!features.length) return <p className="map-empty">No trailheads are visible in this map area. Pan or zoom out to find results.</p>
  return <>
    <ol className="map-result-list" start={safePage * pageSize + 1}>
      {rows.map((feature) => {
        const layer = trailheadLayerById.get(feature.sourceId)
        const trailhead = catalogTrailheadForFeature(feature.id)
        return <li key={feature.id} className={feature.id === selected?.id ? 'selected' : undefined}>
        <button type="button" aria-expanded={feature.id === selected?.id} onClick={() => onSelect(feature.id)}>
          <strong>{trailhead?.name ?? feature.name}</strong><span className="map-result-type">{layer?.color && <i className="map-layer-swatch" style={{ backgroundColor: layer.color }} aria-hidden="true" />}{layer?.label ?? feature.sourceId.replaceAll('-', ' ')}</span>
        </button>
        {feature.id === selected?.id && <div className="map-result-details"><FeatureDetails feature={selected} includeMiniMap /></div>}
      </li>})}
    </ol>
    {pageCount > 1 && <nav className="map-pagination" aria-label="Trailhead result pages">
      <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button>
      <span>Page {safePage + 1} of {pageCount}</span>
      <button type="button" disabled={safePage === pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>Next</button>
    </nav>}
  </>
}

export function TrailheadMap({ center, scope = 'statewide', transitGroups = [], defaultTransitGroups = transitGroups, label = 'Statewide' }: TrailheadMapProps) {
  const {
    targetRef, state, enabledLayers, viewMode, setViewMode, setLayerEnabled,
    activateFeature, clearSelection, retrySource, structuredFilters, setStructuredFilters,
  } = useTrailheadMap({ center, scope, transitGroups, defaultTransitGroups })
  const isScoped = scope !== 'statewide'
  const displayedTransit = isScoped ? transitLayers.filter((layer) => transitGroups.includes(layer.name)) : transitLayers
  const featureLookup = useMemo(() => new Map(state.visible.features.map((feature) => [feature.id, feature])), [state.visible.features])
  const visibleFeatures = state.visible.ids.flatMap((id) => featureLookup.get(id) ?? [])
  const failedLayers = Object.values(state.layers).filter((layer) => layer.status === 'error' || layer.status === 'unavailable')
  const resultsHeadingId = useId()

  return <section className="map-explorer olmap-root" aria-label={`${label} trailhead explorer`}>
    <div className="map-view-switcher" aria-label="Choose map or list view">
      <button type="button" aria-pressed={viewMode === 'map'} onClick={() => setViewMode('map')}>Map</button>
      <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>List</button>
    </div>

    <div className={`map-layout map-view-${viewMode}`}>
      <div className={`map-stage${state.selected ? ' map-stage-has-selection' : ''}`} aria-hidden={viewMode === 'list'} inert={viewMode === 'list'}>
        <div ref={targetRef} className="trailhead-map-target olmap-map" aria-label={isScoped ? `Interactive map of transit-accessible trailheads in ${label}` : 'Interactive map of transit-accessible trailheads statewide'} role="region" />
        <p className="map-noscript">The interactive map requires JavaScript. Browse the <a href="/hikes">hike guides</a> or use the trailhead records instead.</p>
        {state.loading && <p className="map-status" role="status">Loading map data…</p>}
        {state.selected && <SelectionPanel feature={state.selected} active={viewMode === 'map'} onClose={clearSelection} />}
        <p className="map-instruction mobile-map-instruction">Use two fingers to pan the map.</p>
        <p className="map-instruction desktop-map-instruction">Drag to pan. Hold <kbd>Ctrl</kbd> or <kbd>⌘</kbd> while scrolling to zoom.</p>
      </div>

      <section className="map-companion" aria-labelledby={resultsHeadingId} hidden={viewMode === 'map'}>
        <div className="filter-heading"><div><p className="eyebrow">Visible map area</p><h2 id={resultsHeadingId}>Trailhead results</h2></div><span aria-live="polite">{state.visible.total} result{state.visible.total === 1 ? '' : 's'}{state.visible.limited ? ', first 250 shown' : ''}</span></div>
        <ResultList features={visibleFeatures} selected={state.selected} onSelect={activateFeature} />
      </section>

      <aside className="map-filters" aria-label="Map filters">
        <div className="filter-heading"><div><p className="eyebrow">Map layers</p><h2>Filter the map</h2></div><span>Changes apply instantly</span></div>
        <div className={`filter-columns${isScoped ? ' filter-columns-scoped' : ''}`}>
          <fieldset><legend>Trailhead access by type</legend>{trailheadGroups.map((group) => <div className="map-filter-group" key={group.label}><h3>{group.label}</h3>{group.members.map((name) => trailheadLayers.find((layer) => layer.name === name)).map((item) => item && <label className="map-checkbox" key={item.name}><input type="checkbox" checked={enabledLayers.has(item.name)} onChange={(event) => setLayerEnabled(item.name, event.target.checked)} /><i className="map-layer-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" /><span>{item.label}</span></label>)}</div>)}</fieldset>
          <fieldset><legend>Transit and boundaries</legend>
            <label className="map-checkbox"><input type="checkbox" checked={enabledLayers.has('cpad')} onChange={(event) => setLayerEnabled('cpad', event.target.checked)} /><span>Protected areas (CPAD)</span></label>
            {displayedTransit.map((item) => <label className="map-checkbox" key={item.name}><input type="checkbox" checked={enabledLayers.has(item.name)} onChange={(event) => setLayerEnabled(item.name, event.target.checked)} /><span>{item.label}</span></label>)}
          </fieldset>
        </div>
        <fieldset className="catalog-filters"><legend>Trailhead details</legend>
          <label>Place<select value={structuredFilters.placeSlugs?.[0] ?? ''} onChange={(event) => setStructuredFilters({ ...structuredFilters, placeSlugs: event.target.value ? [event.target.value] : undefined })}><option value="">All places</option>{trailheadCatalog.places.filter((place) => place.id !== 'california').map((place) => <option value={place.slug} key={place.id}>{place.title}</option>)}</select></label>
          <label>Maximum walk time<select value={structuredFilters.maximumWalkMinutes ?? ''} onChange={(event) => setStructuredFilters({ ...structuredFilters, maximumWalkMinutes: event.target.value ? Number(event.target.value) : undefined })}><option value="">Any walk time</option><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label>
          <label>Service days<select value={structuredFilters.serviceDays?.[0] ?? ''} onChange={(event) => setStructuredFilters({ ...structuredFilters, serviceDays: event.target.value ? [event.target.value as 'weekday' | 'weekend'] : undefined })}><option value="">Any service</option><option value="weekday">Weekday service</option><option value="weekend">Weekend service</option></select></label>
          <label>Reservation requirement<select value={structuredFilters.reservationRequired === undefined ? '' : String(structuredFilters.reservationRequired)} onChange={(event) => setStructuredFilters({ ...structuredFilters, reservationRequired: event.target.value === '' ? undefined : event.target.value === 'unknown' ? 'unknown' : event.target.value === 'true' })}><option value="">Any status</option><option value="true">Required</option><option value="false">Not required</option><option value="unknown">Not yet classified</option></select></label>
          <label>Seasonal service<select value={structuredFilters.seasonalService === undefined ? '' : String(structuredFilters.seasonalService)} onChange={(event) => setStructuredFilters({ ...structuredFilters, seasonalService: event.target.value === '' ? undefined : event.target.value === 'unknown' ? 'unknown' : event.target.value === 'true' })}><option value="">Any status</option><option value="true">Seasonal</option><option value="false">Year-round</option><option value="unknown">Not yet classified</option></select></label>
          <label>Hike guide<select value={structuredFilters.hasHikeGuide === undefined ? '' : String(structuredFilters.hasHikeGuide)} onChange={(event) => setStructuredFilters({ ...structuredFilters, hasHikeGuide: event.target.value === '' ? undefined : event.target.value === 'true' })}><option value="">With or without</option><option value="true">Has a hike guide</option><option value="false">No hike guide</option></select></label>
        </fieldset>
      </aside>
    </div>

    {state.configError && <div className="map-error" role="alert"><strong>Map unavailable</strong><span>{state.configError}</span><button type="button" onClick={() => window.location.reload()}>Retry map</button></div>}
    {failedLayers.length > 0 && <section className="map-partial-errors" aria-label="Map data issues"><p>Some optional map data could not be loaded. Other layers remain available.</p><ul>{failedLayers.map((layer) => <li key={layer.sourceId}><span>{layer.error?.message ?? `${layer.sourceId} is unavailable`}</span>{layer.error?.retryable && <button type="button" onClick={() => retrySource(layer.sourceId)}>Retry</button>}</li>)}</ul></section>}
  </section>
}
