import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  LayerLoadState,
  MapFeatureDetails,
  TrailheadMapController,
  TrailheadMapEvent,
  TrailheadMapView,
  VisibleFeatureResult,
} from 'olmap'
import { createMapSources, mapHikes } from '../map/sources'

const trailheadLayerIds = ['bus', 'bus-far', 'bus-weekday-only', 'rail', 'rail-far', 'shuttles', 'microtransit', 'call-ahead']
const transitLayerIds = ['bayarea', 'tahoe', 'centralcoast', 'amtrak', 'sacrt', 'central-valley', 'other']
export const mapLayerIds = [...trailheadLayerIds, ...transitLayerIds, 'cpad'] as const
const validLayers = new Set<string>(mapLayerIds)

export type MapViewMode = 'map' | 'list'

interface UseTrailheadMapOptions {
  center?: { longitude: number; latitude: number; zoom: number }
  scope: string
  transitGroups: string[]
  defaultTransitGroups: string[]
}

interface TrailheadMapUiState {
  loading: boolean
  configError?: string
  layers: Record<string, LayerLoadState>
  selected?: MapFeatureDetails
  visible: VisibleFeatureResult
}

const emptyVisible: VisibleFeatureResult = { ids: [], total: 0, limited: false, features: [] }

function readInitialLayers(transitGroups: string[]): Set<string> {
  const requested = new URLSearchParams(window.location.search).getAll('layer').filter((layer) => validLayers.has(layer))
  if (requested.length) return new Set(requested)
  return new Set([...trailheadLayerIds, ...transitGroups])
}

function readInitialView(center?: UseTrailheadMapOptions['center']): Partial<TrailheadMapView> {
  const params = new URLSearchParams(window.location.search)
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const zoom = Number(params.get('z'))
  if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(zoom) && Math.abs(x) <= 20_100_000 && Math.abs(y) <= 20_100_000 && zoom >= 1 && zoom <= 22) {
    return { center: [x, y], zoom }
  }
  if (!center) return {}
  const earthRadius = 6_378_137
  const xCenter = earthRadius * center.longitude * Math.PI / 180
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, center.latitude))
  const yCenter = earthRadius * Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360))
  return { center: [xCenter, yCenter], zoom: center.zoom }
}

function replaceQuery(update: (params: URLSearchParams) => void): void {
  const params = new URLSearchParams(window.location.search)
  update(params)
  const query = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
}

function validFeatureId(value: string | null): string | undefined {
  return value && value.length <= 500 && /^[\w:|.-]+$/.test(value) ? value : undefined
}

export function useTrailheadMap({ center, scope, transitGroups, defaultTransitGroups }: UseTrailheadMapOptions) {
  const centerLatitude = center?.latitude
  const centerLongitude = center?.longitude
  const centerZoom = center?.zoom
  const targetRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<TrailheadMapController>(null)
  const transitGroupKey = transitGroups.join('|')
  const [enabledLayers, setEnabledLayers] = useState(() => readInitialLayers(defaultTransitGroups))
  const [viewMode, setViewModeState] = useState<MapViewMode>(() => new URLSearchParams(window.location.search).get('view') === 'list' ? 'list' : 'map')
  const [state, setState] = useState<TrailheadMapUiState>({ loading: true, layers: {}, visible: emptyVisible })
  const enabledLayersRef = useRef(enabledLayers)
  enabledLayersRef.current = enabledLayers

  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    const abortController = new AbortController()
    let controller: TrailheadMapController | undefined
    setState({ loading: true, layers: {}, visible: emptyVisible })

    const handleEvent = (event: TrailheadMapEvent) => {
      if (event.type === 'loading-change') setState((current) => ({ ...current, loading: event.loading }))
      if (event.type === 'layer-progress') setState((current) => ({ ...current, layers: { ...current.layers, [event.layer.sourceId]: event.layer } }))
      if (event.type === 'visible-features-change') setState((current) => ({ ...current, visible: event }))
      if (event.type === 'feature-select') {
        setState((current) => ({ ...current, selected: event.feature }))
        replaceQuery((params) => params.set('selected', event.feature.id))
      }
      if (event.type === 'selection-clear') {
        setState((current) => ({ ...current, selected: undefined }))
        replaceQuery((params) => params.delete('selected'))
      }
      if (event.type === 'move-end') replaceQuery((params) => {
        params.set('x', event.view.center[0].toFixed(2))
        params.set('y', event.view.center[1].toFixed(2))
        params.set('z', event.view.zoom.toFixed(2))
      })
    }

    void (async () => {
      try {
        const { createTrailheadMap, validateConfig } = await import('olmap')
        const response = await fetch('/assets/data/config.json', { signal: abortController.signal })
        if (!response.ok) throw new Error(`Configuration request returned HTTP ${response.status}`)
        const config = validateConfig(await response.json())
        if (abortController.signal.aborted) return
        const params = new URLSearchParams(window.location.search)
        controller = createTrailheadMap({
          target,
          config,
          dataSources: createMapSources(config, enabledLayersRef.current),
          hikes: mapHikes,
          initialView: readInitialView(centerLatitude !== undefined && centerLongitude !== undefined && centerZoom !== undefined
            ? { latitude: centerLatitude, longitude: centerLongitude, zoom: centerZoom }
            : undefined),
          initialSelectedFeatureId: validFeatureId(params.get('selected')),
          initialFilters: { showProtectedAreas: enabledLayersRef.current.has('cpad') },
          tileSource: {
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Map data © OpenStreetMap contributors',
          },
          protectedAreaTileSource: {
            url: 'https://gis.cnra.ca.gov/arcgis/rest/services/Boundaries/CPAD_AccessType/MapServer',
            attribution: 'CPAD data © GreenInfo Network',
            params: { LAYERS: 'show:1' },
            opacity: 0.4,
          },
          visibleFeatureLimit: 250,
          visibleFeaturesDebounceMs: 100,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onEvent: handleEvent,
        })
        controllerRef.current = controller
        await controller.ready
      } catch (error) {
        if (!abortController.signal.aborted) setState((current) => ({ ...current, loading: false, configError: error instanceof Error ? error.message : String(error) }))
      }
    })()

    return () => {
      abortController.abort()
      controller?.destroy()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [centerLatitude, centerLongitude, centerZoom, scope, transitGroupKey])

  const setLayerEnabled = useCallback((layerId: string, enabled: boolean) => {
    setEnabledLayers((current) => {
      const next = new Set(current)
      if (enabled) next.add(layerId); else next.delete(layerId)
      replaceQuery((params) => {
        params.delete('layer')
        mapLayerIds.filter((id) => next.has(id)).forEach((id) => params.append('layer', id))
      })
      return next
    })
    controllerRef.current?.setLayerVisibility(layerId === 'cpad' ? 'protected-areas' : layerId, enabled)
  }, [])

  const setViewMode = useCallback((mode: MapViewMode) => {
    setViewModeState(mode)
    replaceQuery((params) => params.set('view', mode))
    if (mode === 'map') requestAnimationFrame(() => controllerRef.current?.updateSize())
  }, [])

  return {
    targetRef,
    state,
    enabledLayers,
    viewMode,
    setViewMode,
    setLayerEnabled,
    selectFeature: (id: string) => controllerRef.current?.selectFeature(id),
    activateFeature: (id: string) => controllerRef.current?.activateFeature(id),
    clearSelection: () => controllerRef.current?.clearSelection(),
    retrySource: (sourceId: string) => controllerRef.current?.refresh({ sourceIds: [sourceId], bypassCache: true }),
  }
}
