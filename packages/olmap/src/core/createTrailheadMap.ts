import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import GPX from 'ol/format/GPX.js';
import KML from 'ol/format/KML.js';
import type Geometry from 'ol/geom/Geometry.js';
import Point from 'ol/geom/Point.js';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import DragPan from 'ol/interaction/DragPan.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OlMap from 'ol/Map.js';
import Overlay from 'ol/Overlay.js';
import { fromLonLat, transform } from 'ol/proj.js';
import VectorSource from 'ol/source/Vector.js';
import Cluster from 'ol/source/Cluster.js';
import OSM from 'ol/source/OSM.js';
import TileArcGISRest from 'ol/source/TileArcGISRest.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';
import View from 'ol/View.js';
import { getCenter } from 'ol/extent.js';
import { platformModifierKeyOnly } from 'ol/events/condition.js';
import { unByKey } from 'ol/Observable.js';
import type { EventsKey } from 'ol/events.js';
import { createEmpty, extend as extendExtent } from 'ol/extent.js';
import type { ConfigFile, RouteConfig } from '../config/schema';
import { clearDataSourceCache, DataSourceUnavailableError, loadDataSource } from '../data/loaders';
import { normalizeSourceProperties } from '../data/normalize';
import { createClusterId, sortedClusterMemberIds } from './clustering';
import type { SourceMetadata } from '../data/types';
import { cloneFilters, collectVisibleFeatures, dataSourceMatchesFilters, featureMatchesFilters, mergeFilters } from './filters';
import {
  createStableFeatureId,
  normalizeFeatureDetails,
  normalizeFeatureProperties,
  normalizeFeatureSummary,
  type FeaturePresentationInput,
} from '../presentation/features';
import {
  type Coordinate,
  type ClusteringOptions,
  type MapDataSource,
  type MapFeatureKind,
  type MapHike,
  type LayerLoadState,
  type TrailheadMapController,
  type TrailheadMapEvent,
  type TrailheadMapFilters,
  type TrailheadMapOptions,
  type TrailheadMapState,
  type TrailheadMapView,
  type VisibleFeatureResult,
} from './types';

type MapFeature = Feature<Geometry>;
type MapVectorSource = VectorSource<MapFeature>;
type MapVectorLayer = VectorLayer<MapVectorSource, MapFeature>;

interface ManagedVectorLayer {
  definition: MapDataSource;
  layer: MapVectorLayer;
  source: VectorSource<MapFeature>;
  abortController?: AbortController;
  loadGeneration: number;
  loading: boolean;
  bypassCache: boolean;
  clusterSource?: Cluster<MapFeature>;
  clustering?: ClusteringOptions;
}

const DEFAULT_CENTER: Coordinate = [-13611974.488458559, 4558011.3361273315];
const DEFAULT_FILTERS: TrailheadMapFilters = { accessModes: [] };
const DEFAULT_CLUSTERING: ClusteringOptions = {
  enabled: true,
  distance: 55,
  minZoom: 0,
  maxZoom: 14,
  expansionZoomDelta: 2,
};

const TRAILHEAD_COLORS: Record<string, string> = {
  bus: '#0288d1',
  'bus-far': '#0097a7',
  'bus-weekday-only': '#1a237e',
  rail: '#f57c00',
  'rail-far': '#e65100',
  shuttles: '#000000',
  microtransit: '#757575',
  'call-ahead': '#bdbdbd',
};
const clusterStyleCache = new globalThis.Map<string, Style>();
const trailheadStyleCache = new globalThis.Map<string, Style>();

function trailheadStyle(sourceId: string, feature?: MapFeature): Style {
  const markerColor = feature?.get('marker_color');
  const label = feature?.get('marker_label');
  const color = typeof markerColor === 'string' && markerColor ? markerColor : TRAILHEAD_COLORS[sourceId] ?? '#c5522f';
  const labelText = typeof label === 'string' ? label : '';
  const key = `${sourceId}:${color}:${labelText}`;
  const cached = trailheadStyleCache.get(key);
  if (cached) return cached;
  const style = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
    text: labelText ? new Text({
      text: labelText,
      offsetX: 13,
      textAlign: 'left',
      font: '700 13px system-ui, sans-serif',
      fill: new Fill({ color: '#17231d' }),
      stroke: new Stroke({ color: '#fff', width: 4 }),
    }) : undefined,
  });
  trailheadStyleCache.set(key, style);
  return style;
}

function clusterStyle(sourceId: string, size: number): Style {
  const color = TRAILHEAD_COLORS[sourceId] ?? '#24543f';
  const key = `${sourceId}:${size}`;
  const cached = clusterStyleCache.get(key);
  if (cached) return cached;
  const style = new Style({
    image: new CircleStyle({
      radius: Math.min(20, 11 + Math.log2(size) * 2),
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
    text: new Text({
      text: String(size),
      fill: new Fill({ color: sourceId === 'call-ahead' ? '#211f1b' : '#fff' }),
    }),
  });
  clusterStyleCache.set(key, style);
  return style;
}

const hikeStyles: Record<string, Style> = {
  Point: new Style({
    image: new CircleStyle({
      fill: new Fill({ color: 'rgba(255,255,0,0.4)' }),
      radius: 5,
      stroke: new Stroke({ color: '#ff0', width: 1 }),
    }),
  }),
  LineString: new Style({ stroke: new Stroke({ color: '#f00', width: 3 }) }),
  MultiLineString: new Style({ stroke: new Stroke({ color: '#38240b', width: 2.5 }) }),
};

function routeConfiguration(config: ConfigFile, feedId: string): Record<string, RouteConfig> {
  const routes: Record<string, RouteConfig> = {};
  for (const agency of Object.values(config.feeds[feedId]?.agencies ?? {})) {
    Object.assign(routes, agency.routes);
  }
  return routes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sourceKind(definition: MapDataSource, feature?: MapFeature): MapFeatureKind {
  if (definition.role === 'trailhead') return 'trailhead';
  if (definition.role === 'hike') return 'hike';
  if (definition.role === 'protected-area') return 'protected-area';
  return feature?.get('stop_id') ? 'transit-stop' : 'transit-route';
}

function mapCoordinate(feature: MapFeature): Coordinate | undefined {
  const geometry = feature.getGeometry();
  if (!geometry) return undefined;
  const coordinate = geometry instanceof Point ? geometry.getCoordinates() : getCenter(geometry.getExtent());
  return [coordinate[0], coordinate[1]];
}

function presentationInput(feature: MapFeature, definition: MapDataSource, clickCoordinate?: Coordinate): FeaturePresentationInput {
  const coordinate = clickCoordinate ?? mapCoordinate(feature);
  const longitudeLatitude = coordinate ? transform(coordinate, 'EPSG:3857', 'EPSG:4326') : undefined;
  const clusterMembers = feature.get('features');
  return {
    id: String(feature.getId()),
    kind: Array.isArray(clusterMembers) && clusterMembers.length > 1 ? 'cluster' : sourceKind(definition, feature),
    sourceId: definition.id,
    coordinate,
    longitudeLatitude: longitudeLatitude ? [longitudeLatitude[0], longitudeLatitude[1]] : undefined,
    properties: feature.getProperties(),
  };
}

export function createTrailheadMap(options: TrailheadMapOptions): TrailheadMapController {
  let destroyed = false;
  let loadingCount = 0;
  let selectedFeature: MapFeature | undefined;
  let selectedDefinition: MapDataSource | undefined;
  let pendingSelectionId = options.initialSelectedFeatureId;
  let visibleFeaturesTimer: ReturnType<typeof setTimeout> | undefined;
  const listenerKeys: EventsKey[] = [];
  const vectorLayers = new globalThis.Map<string, ManagedVectorLayer>();
  const hikes = new globalThis.Map<string, MapHike>((options.hikes ?? []).map((hike) => [hike.id, hike]));
  const emit = (event: TrailheadMapEvent) => {
    if (!destroyed) options.onEvent?.(event);
  };

  const initialCenter = options.initialView?.center ?? DEFAULT_CENTER;
  const view = new View({
    center: initialCenter,
    zoom: options.initialView?.zoom ?? 9,
    projection: 'EPSG:3857',
  });
  const baseSource = new OSM({
    url: options.tileSource.url,
    attributions: options.tileSource.attribution,
    maxZoom: options.tileSource.maxZoom,
  });
  const baseLayer = new TileLayer({ source: baseSource, properties: { sourceId: 'base', role: 'base' } });
  const layers: Array<TileLayer<OSM | TileArcGISRest> | MapVectorLayer> = [baseLayer];
  const routePositionSource = new VectorSource<MapFeature>();
  const routePositionLayer = new VectorLayer<MapVectorSource, MapFeature>({
    source: routePositionSource,
    zIndex: 1000,
    style: new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#f7f2e8' }),
        stroke: new Stroke({ color: '#174a37', width: 3 }),
      }),
    }),
    properties: { sourceId: 'route-position', role: 'route-position' },
  });
  layers.push(routePositionLayer);

  let protectedAreaLayer: TileLayer<TileArcGISRest> | undefined;
  if (options.protectedAreaTileSource) {
    protectedAreaLayer = new TileLayer({
      source: new TileArcGISRest({
        url: options.protectedAreaTileSource.url,
        attributions: options.protectedAreaTileSource.attribution,
        params: options.protectedAreaTileSource.params,
      }),
      opacity: options.protectedAreaTileSource.opacity ?? 0.4,
      visible: options.initialFilters?.showProtectedAreas ?? false,
      properties: { sourceId: 'protected-areas', role: 'protected-area' },
    });
    layers.push(protectedAreaLayer);
  }

  const dragPan: DragPan = new DragPan({
    condition: (event): boolean => {
      if (typeof navigator === 'undefined' || !navigator.userAgent.toLowerCase().includes('mobi')) return true;
      return dragPan.getPointerCount() === 2 || platformModifierKeyOnly(event);
    },
  });
  const map = new OlMap({
    target: options.target,
    layers,
    view,
    interactions: defaultInteractions({ dragPan: false, mouseWheelZoom: false, altShiftDragRotate: false, pinchRotate: false }).extend([
      dragPan,
      new MouseWheelZoom({ condition: platformModifierKeyOnly }),
    ]),
  });
  const popupOverlay = options.popupElement ? new Overlay({
    element: options.popupElement,
    offset: [0, -15],
    autoPan: { animation: options.reducedMotion ? undefined : { duration: 250 } },
  }) : undefined;
  if (popupOverlay) map.addOverlay(popupOverlay);

  let state: TrailheadMapState = {
    view: currentView(),
    filters: mergeFilters(DEFAULT_FILTERS, options.initialFilters ?? {}),
    selectedFeatureId: options.initialSelectedFeatureId,
    visibleTrailheadIds: [],
    status: 'loading',
    layers: {},
  };

  function currentView(): TrailheadMapView {
    const center = view.getCenter() ?? DEFAULT_CENTER;
    const extent = map.isRendered() ? view.calculateExtent(map.getSize()) : undefined;
    return {
      center: [center[0], center[1]],
      zoom: view.getZoom() ?? 9,
      extent: extent ? [extent[0], extent[1], extent[2], extent[3]] : undefined,
    };
  }

  function stateSnapshot(): TrailheadMapState {
    return {
      ...state,
      view: {
        ...state.view,
        center: [...state.view.center],
        extent: state.view.extent ? [...state.view.extent] : undefined,
      },
      filters: cloneFilters(state.filters),
      visibleTrailheadIds: [...state.visibleTrailheadIds],
      layers: Object.fromEntries(Object.entries(state.layers).map(([sourceId, layer]) => [sourceId, {
        ...layer,
        progress: layer.progress ? { ...layer.progress } : undefined,
        metadata: layer.metadata ? { ...layer.metadata } : undefined,
        error: layer.error ? { ...layer.error } : undefined,
      }])),
    };
  }

  function updateLayerState(sourceId: string, update: Partial<LayerLoadState>): LayerLoadState {
    const previous = state.layers[sourceId];
    const layer: LayerLoadState = {
      ...previous,
      ...update,
      sourceId,
      status: update.status ?? previous?.status ?? 'idle',
    };
    state = { ...state, layers: { ...state.layers, [sourceId]: layer } };
    emit({ type: 'layer-progress', layer: {
      ...layer,
      progress: layer.progress ? { ...layer.progress } : undefined,
      metadata: layer.metadata ? { ...layer.metadata } : undefined,
      error: layer.error ? { ...layer.error } : undefined,
    } });
    return layer;
  }

  function changeLoading(delta: number, sourceId?: string): void {
    loadingCount = Math.max(0, loadingCount + delta);
    state = { ...state, status: loadingCount > 0 ? 'loading' : 'ready' };
    emit({ type: 'loading-change', loading: loadingCount > 0, sourceId });
  }

  function assignFeatureIds(features: MapFeature[], definition: MapDataSource, metadata?: SourceMetadata): void {
    features.forEach((feature, index) => {
      if (metadata) feature.setProperties(normalizeSourceProperties(feature.getProperties(), metadata), true);
      const existing = feature.getId();
      const properties = feature.getProperties();
      const stableId = existing !== undefined && String(existing).startsWith(`${definition.id}:`)
        ? String(existing)
        : existing !== undefined
        ? `${definition.id}:${String(existing)}`
        : createStableFeatureId(definition.id, properties, mapCoordinate(feature), index);
      feature.setId(stableId);
      feature.set('sourceId', definition.id, true);
      feature.set('role', definition.role, true);
      if (definition.hikeId) {
        const hike = hikes.get(definition.hikeId);
        if (hike) feature.setProperties({ ...hike, difficultyhuman: hike.difficultyLabel }, true);
      }
    });
  }

  function parseFeatures(definition: MapDataSource, payload: unknown, projection: string): MapFeature[] {
    if (definition.kind === 'geojson') {
      if (!isRecord(payload)) throw new Error('GeoJSON payload must be an object');
      const routes = routeConfiguration(options.config, definition.id);
      const features = Array.isArray(payload.features)
        ? payload.features.filter((candidate) => {
            if (!isRecord(candidate) || !isRecord(candidate.properties)) return true;
            const routeId = candidate.properties.route_id;
            return typeof routeId !== 'string' || !routes[routeId]?.hidden;
          })
        : [];
      return new GeoJSON().readFeatures({ ...payload, features }, { featureProjection: projection }) as MapFeature[];
    }
    if (typeof payload !== 'string') throw new Error(`${definition.kind.toUpperCase()} payload must be text`);
    const format = definition.kind === 'kml' ? new KML({ showPointNames: false }) : new GPX();
    return format.readFeatures(payload, { featureProjection: projection }) as MapFeature[];
  }

  function clusteringFor(definition: MapDataSource): ClusteringOptions | undefined {
    const globalOptions = { ...DEFAULT_CLUSTERING, ...options.clustering };
    const sourceOptions = definition.clustering;
    const included = !globalOptions.sourceIds || globalOptions.sourceIds.includes(definition.id);
    if (definition.role !== 'trailhead' || sourceOptions === false || !included) return undefined;
    const resolved = typeof sourceOptions === 'object' ? { ...globalOptions, ...sourceOptions } : globalOptions;
    return resolved.enabled ? resolved : undefined;
  }

  function createClusterSource(
    definition: MapDataSource,
    source: VectorSource<MapFeature>,
    clustering: ClusteringOptions,
  ): Cluster<MapFeature> {
    return new Cluster<MapFeature>({
      source,
      distance: clustering.distance,
      geometryFunction: (feature) => feature.getGeometry() instanceof Point
        ? feature.getGeometry() as Point
        : null as unknown as Point,
      createCluster: (geometry, members) => {
        const memberIds = sortedClusterMemberIds(members.map((member) => String(member.getId())));
        const cluster = new Feature({
          geometry,
          features: members,
          clusterSize: memberIds.length,
          clusterMemberIds: memberIds,
          name: `${memberIds.length} trailheads`,
          sourceId: definition.id,
          role: definition.role,
        });
        cluster.setId(createClusterId({ sourceId: definition.id, memberIds }));
        return cluster;
      },
    });
  }

  function updateClusteringForZoom(): void {
    const zoom = view.getZoom() ?? 9;
    for (const managed of vectorLayers.values()) {
      if (!managed.clusterSource || !managed.clustering) continue;
      const enabled = zoom >= managed.clustering.minZoom && zoom <= managed.clustering.maxZoom;
      const nextSource = enabled ? managed.clusterSource : managed.source;
      if (managed.layer.getSource() !== nextSource) managed.layer.setSource(nextSource);
    }
  }

  async function loadLayer(managed: ManagedVectorLayer, projection: string): Promise<void> {
    const { definition, source } = managed;
    const generation = ++managed.loadGeneration;
    managed.abortController?.abort();
    const abortController = new AbortController();
    managed.abortController = abortController;
    if (!managed.loading) {
      managed.loading = true;
      changeLoading(1, definition.id);
    }
    updateLayerState(definition.id, { status: 'loading', error: undefined });
    try {
      const loaded = await loadDataSource(
        definition,
        abortController.signal,
        (progress) => updateLayerState(definition.id, { status: 'loading', progress }),
        managed.bypassCache,
      );
      managed.bypassCache = false;
      if (destroyed || generation !== managed.loadGeneration) return;
      const features = parseFeatures(definition, loaded.data, projection);
      assignFeatureIds(features, definition, loaded.metadata);
      source.clear(true);
      source.addFeatures(features);
      updateLayerState(definition.id, {
        status: 'ready',
        progress: { phase: 'complete', fraction: 1 },
        metadata: loaded.metadata,
        error: undefined,
      });
      commitVisibleFeatures(true);
      if (pendingSelectionId) {
        const pending = findFeature(pendingSelectionId);
        if (pending) {
          pendingSelectionId = undefined;
          select(pending.feature, pending.definition);
        }
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        const unavailable = error instanceof DataSourceUnavailableError;
        const mapError = {
          code: definition.role === 'protected-area'
            ? 'protected-area' as const
            : definition.kind === 'vector-tile'
              ? 'unknown' as const
              : definition.kind,
          message: `Failed to load ${definition.id}: ${error instanceof Error ? error.message : String(error)}`,
          sourceId: definition.id,
          retryable: !unavailable,
        };
        updateLayerState(definition.id, {
          status: unavailable ? 'unavailable' : 'error',
          error: mapError,
          progress: undefined,
        });
        emit({ type: 'error', error: mapError });
      }
    } finally {
      if (generation === managed.loadGeneration && managed.loading) {
        managed.loading = false;
        changeLoading(-1, definition.id);
      }
    }
  }

  function addDataSource(definition: MapDataSource): void {
    if (definition.kind === 'vector-tile') return;
    const source = new VectorSource<MapFeature>({
      useSpatialIndex: true,
      loader: (_extent, _resolution, projection) => {
        const managed = vectorLayers.get(definition.id);
        if (managed && !managed.abortController) void loadLayer(managed, projection.getCode());
      },
    });
    const clustering = clusteringFor(definition);
    const clusterSource = clustering ? createClusterSource(definition, source, clustering) : undefined;
    const zoom = view.getZoom() ?? 9;
    const displayedSource = clusterSource && clustering && zoom >= clustering.minZoom && zoom <= clustering.maxZoom
      ? clusterSource
      : source;
    const layer = new VectorLayer<MapVectorSource, MapFeature>({
      source: displayedSource,
      visible: definition.visible ?? definition.role !== 'transit',
      style: definition.role === 'hike'
        ? (candidate) => {
            if (!(candidate instanceof Feature)) return undefined;
            const feature = candidate as MapFeature;
            const geometry = feature.getGeometry();
            return geometry ? hikeStyles[geometry.getType()] : undefined;
          }
        : definition.role === 'trailhead' || definition.pointMarkers
          ? (candidate, resolution) => {
              if (!(candidate instanceof Feature)) return undefined;
              const feature = candidate as MapFeature;
              const members = feature.get('features');
              if (Array.isArray(members)) {
                if (members.length > 1) return clusterStyle(definition.id, members.length);
                const member = members[0];
                return member instanceof Feature ? member.getStyleFunction()?.(member, resolution) ?? trailheadStyle(definition.id, member as MapFeature) : undefined;
              }
              const summary = normalizeFeatureSummary(presentationInput(feature, definition));
              const filterable = {
                id: summary.id,
                name: summary.name,
                sourceId: definition.id,
                properties: normalizeFeatureProperties(feature.getProperties()),
                visibleOnMap: true,
              };
              return featureMatchesFilters(filterable, state.filters)
                ? feature.getStyleFunction()?.(feature, resolution) ?? trailheadStyle(definition.id, feature)
                : undefined;
            }
          : undefined,
      properties: { sourceId: definition.id, role: definition.role, groupIds: definition.groupIds ?? [] },
    });
    const managed: ManagedVectorLayer = {
      definition,
      layer,
      source,
      clusterSource,
      clustering,
      loadGeneration: 0,
      loading: false,
      bypassCache: false,
    };
    vectorLayers.set(definition.id, managed);
    updateLayerState(definition.id, {
      status: definition.unavailableReason ? 'unavailable' : 'idle',
      error: definition.unavailableReason ? {
        code: definition.role === 'protected-area' ? 'protected-area' : definition.kind,
        message: definition.unavailableReason,
        sourceId: definition.id,
        retryable: false,
      } : undefined,
    });
    map.addLayer(layer);
    if (layer.getVisible() && !definition.unavailableReason) void loadLayer(managed, view.getProjection().getCode());
  }

  function removeDataSources(): void {
    for (const managed of vectorLayers.values()) {
      managed.abortController?.abort();
      if (managed.loading) {
        managed.loading = false;
        changeLoading(-1, managed.definition.id);
      }
      managed.loadGeneration += 1;
      managed.source.clear(true);
      managed.clusterSource?.setSource(null);
      map.removeLayer(managed.layer);
    }
    vectorLayers.clear();
  }

  function ensureLayerLoaded(managed: ManagedVectorLayer): void {
    const status = state.layers[managed.definition.id]?.status;
    if (managed.definition.unavailableReason || managed.loading || status === 'ready') return;
    managed.abortController = undefined;
    void loadLayer(managed, view.getProjection().getCode());
  }

  function applyFilters(): void {
    for (const managed of vectorLayers.values()) {
      const { definition, layer } = managed;
      if (definition.role === 'trailhead' || (definition.role === 'transit' && state.filters.transitGroups)) {
        layer.setVisible(dataSourceMatchesFilters(definition, state.filters));
      }
      if (definition.role === 'trailhead') layer.changed();
      if (layer.getVisible() && state.layers[definition.id]?.status === 'idle' && !managed.abortController) {
        ensureLayerLoaded(managed);
      }
    }
    if (protectedAreaLayer && state.filters.showProtectedAreas !== undefined) {
      protectedAreaLayer.setVisible(state.filters.showProtectedAreas);
    }
  }

  function calculateVisibleFeatures(): VisibleFeatureResult {
    const extent = view.calculateExtent(map.getSize());
    const features = [...vectorLayers.values()]
      .filter(({ definition }) => definition.role === 'trailhead')
      .flatMap(({ definition, layer, source }) => source.getFeaturesInExtent(extent).map((feature) => {
        const summary = normalizeFeatureSummary(presentationInput(feature, definition));
        return {
          id: summary.id,
          name: summary.name,
          sourceId: definition.id,
          properties: normalizeFeatureProperties(feature.getProperties()),
          visibleOnMap: layer.getVisible(),
        };
      }));
    return collectVisibleFeatures(
      features,
      state.filters,
      state.selectedFeatureId,
      options.visibleFeatureLimit ?? 250,
    );
  }

  function commitVisibleFeatures(shouldEmit: boolean): VisibleFeatureResult {
    const result = calculateVisibleFeatures();
    state = { ...state, visibleTrailheadIds: [...result.ids] };
    if (shouldEmit) emit({ type: 'visible-features-change', ...result });
    return result;
  }

  function scheduleVisibleFeatures(): void {
    if (visibleFeaturesTimer) clearTimeout(visibleFeaturesTimer);
    visibleFeaturesTimer = setTimeout(() => {
      visibleFeaturesTimer = undefined;
      if (!destroyed) commitVisibleFeatures(true);
    }, Math.max(0, options.visibleFeaturesDebounceMs ?? 100));
  }

  function findFeature(id: string): { feature: MapFeature; definition: MapDataSource } | undefined {
    for (const managed of vectorLayers.values()) {
      const feature = managed.source.getFeatureById(id) ?? managed.clusterSource?.getFeatureById(id);
      if (feature instanceof Feature) return { feature, definition: managed.definition };
    }
    return undefined;
  }

  function select(feature: MapFeature, definition: MapDataSource, coordinate?: Coordinate): void {
    selectedFeature = feature;
    selectedDefinition = definition;
    const id = String(feature.getId());
    state = { ...state, selectedFeatureId: id };
    const position = coordinate ?? mapCoordinate(feature);
    if (position) popupOverlay?.setPosition(position);
    emit({ type: 'feature-select', feature: normalizeFeatureDetails(presentationInput(feature, definition, coordinate)) });
  }

  function clearSelected(emitWhenEmpty = true): void {
    const hadSelection = Boolean(selectedFeature || state.selectedFeatureId || pendingSelectionId);
    selectedFeature = undefined;
    selectedDefinition = undefined;
    pendingSelectionId = undefined;
    popupOverlay?.setPosition(undefined);
    state = { ...state, selectedFeatureId: undefined };
    if (hadSelection || emitWhenEmpty) emit({ type: 'selection-clear' });
  }

  function activate(feature: MapFeature, definition: MapDataSource, focusSingle = false): void {
    const members = feature.get('features');
    if (!Array.isArray(members) || members.length < 2) {
      select(feature, definition);
      if (focusSingle) {
        const coordinate = mapCoordinate(feature);
        if (coordinate) view.animate({ center: coordinate, zoom: Math.max(view.getZoom() ?? 9, 14), duration: options.reducedMotion ? 0 : 250 });
      }
      return;
    }
    clearSelected(false);
    const managed = vectorLayers.get(definition.id);
    const extent = createEmpty();
    for (const member of members) {
      if (member instanceof Feature) {
        const geometry = member.getGeometry();
        if (geometry) extendExtent(extent, geometry.getExtent());
      }
    }
    const currentZoom = view.getZoom() ?? 9;
    view.fit(extent, {
      size: map.getSize(),
      padding: [32, 32, 32, 32],
      maxZoom: currentZoom + (managed?.clustering?.expansionZoomDelta ?? DEFAULT_CLUSTERING.expansionZoomDelta),
      duration: options.reducedMotion ? 0 : 250,
    });
  }

  options.dataSources.forEach(addDataSource);
  applyFilters();
  commitVisibleFeatures(false);
  if (options.initialView?.extent) view.fit(options.initialView.extent, { size: map.getSize() });

  function resolveRenderedFeature(candidate: unknown, layer: unknown): { feature: MapFeature; definition: MapDataSource } | undefined {
    if (!(candidate instanceof Feature) || !(layer instanceof VectorLayer)) return undefined;
    const sourceId = String(layer.get('sourceId') ?? 'unknown');
    const managed = vectorLayers.get(sourceId);
    if (!managed) return undefined;
    const members = candidate.get('features');
    const feature = Array.isArray(members) && members.length === 1 && members[0] instanceof Feature
      ? members[0] as MapFeature
      : candidate as MapFeature;
    return { feature, definition: managed.definition };
  }

  listenerKeys.push(
    map.on('pointermove', (event) => {
      if (event.dragging) {
        emit({ type: 'feature-hover' });
        return;
      }
      const result = map.forEachFeatureAtPixel(event.pixel, (candidate, layer) => {
        return resolveRenderedFeature(candidate, layer);
      }, { hitTolerance: 5 });
      emit({
        type: 'feature-hover',
        feature: result ? normalizeFeatureSummary(presentationInput(result.feature, result.definition)) : undefined,
        pixel: [event.pixel[0], event.pixel[1]],
      });
      emit({
        type: 'route-position-change',
        coordinate: result?.definition.role === 'hike' ? [event.coordinate[0], event.coordinate[1]] : undefined,
      });
    }),
    map.on('click', (event) => {
      let result = map.forEachFeatureAtPixel(event.pixel, (candidate, layer) => resolveRenderedFeature(candidate, layer));
      if (!result) {
        const nearby = new globalThis.Map<string, { feature: MapFeature; definition: MapDataSource }>();
        map.forEachFeatureAtPixel(event.pixel, (candidate, layer) => {
          const resolved = resolveRenderedFeature(candidate, layer);
          if (resolved) nearby.set(String(resolved.feature.getId()), resolved);
          return undefined;
        }, { hitTolerance: 14 });
        if (nearby.size === 1) result = nearby.values().next().value;
      }
      if (result) activate(result.feature, result.definition);
    }),
    map.on('moveend', () => {
      state = { ...state, view: currentView() };
      emit({ type: 'move-end', view: state.view });
      scheduleVisibleFeatures();
    }),
    view.on('change:center', () => {
      state = { ...state, view: currentView() };
      emit({ type: 'view-change', view: state.view });
    }),
    view.on('change:resolution', () => {
      state = { ...state, view: currentView() };
      updateClusteringForZoom();
      emit({ type: 'view-change', view: state.view });
    }),
    baseSource.on('tileloaderror', () => emit({
      type: 'error',
      error: { code: 'tile', message: 'A base-map tile failed to load', sourceId: 'base', retryable: true },
    })),
  );

  let resolveReady: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });
  queueMicrotask(() => {
    resolveReady();
    if (destroyed) return;
    state = { ...state, status: loadingCount > 0 ? 'loading' : 'ready' };
    emit({ type: 'ready', state: stateSnapshot() });
    if (pendingSelectionId) controller.selectFeature(pendingSelectionId);
  });

  const controller: TrailheadMapController = {
    ready,
    getState: stateSnapshot,
    setFilters: (filters) => {
      if (destroyed) return;
      state = {
        ...state,
        filters: {
          ...mergeFilters(state.filters, filters),
        },
      };
      applyFilters();
      const visibleResult = commitVisibleFeatures(false);
      emit({ type: 'filters-change', filters: cloneFilters(state.filters) });
      emit({ type: 'visible-features-change', ...visibleResult });
    },
    setView: (nextView) => {
      if (destroyed) return;
      if (nextView.center) view.setCenter(nextView.center);
      if (nextView.zoom !== undefined) view.setZoom(nextView.zoom);
      state = { ...state, view: currentView() };
    },
    fitToExtent: (extent, fitOptions) => {
      if (destroyed) return;
      view.fit(extent, {
        padding: fitOptions?.padding,
        maxZoom: fitOptions?.maxZoom,
        duration: options.reducedMotion ? 0 : fitOptions?.durationMs,
        size: map.getSize(),
      });
    },
    selectFeature: (id) => {
      if (destroyed) return;
      pendingSelectionId = id;
      const result = findFeature(id);
      if (result) {
        pendingSelectionId = undefined;
        select(result.feature, result.definition);
      }
    },
    activateFeature: (id) => {
      if (destroyed) return;
      const result = findFeature(id);
      if (result) activate(result.feature, result.definition, true);
    },
    setRoutePosition: (coordinate) => {
      if (destroyed) return;
      routePositionSource.clear(true);
      if (coordinate) routePositionSource.addFeature(new Feature(new Point(coordinate)));
    },
    clearSelection: () => {
      if (destroyed) return;
      clearSelected();
    },
    setHikes: (nextHikes) => {
      if (destroyed) return;
      hikes.clear();
      nextHikes.forEach((hike) => hikes.set(hike.id, hike));
      for (const managed of vectorLayers.values()) {
        if (managed.definition.hikeId) assignFeatureIds(managed.source.getFeatures(), managed.definition);
      }
      if (selectedFeature && selectedDefinition) select(selectedFeature, selectedDefinition);
    },
    setDataSources: (sources) => {
      if (destroyed) return;
      removeDataSources();
      state = { ...state, layers: {} };
      sources.forEach(addDataSource);
      applyFilters();
      commitVisibleFeatures(true);
    },
    setLayerVisibility: (layerId, visible) => {
      if (destroyed) return;
      if (layerId === 'protected-areas') protectedAreaLayer?.setVisible(visible);
      else {
        const direct = vectorLayers.get(layerId);
        if (direct) {
          direct.layer.setVisible(visible);
          if (visible) ensureLayerLoaded(direct);
        }
        else {
          for (const managed of vectorLayers.values()) {
            if (managed.definition.groupIds?.includes(layerId)) {
              managed.layer.setVisible(visible);
              if (visible) ensureLayerLoaded(managed);
            }
          }
        }
      }
      commitVisibleFeatures(true);
      emit({ type: 'layer-visibility-change', layerId, visible });
    },
    refresh: (refreshOptions) => {
      if (destroyed) return;
      for (const managed of vectorLayers.values()) {
        if (refreshOptions?.sourceIds && !refreshOptions.sourceIds.includes(managed.definition.id)) continue;
        managed.abortController?.abort();
        if (managed.loading) {
          managed.loading = false;
          changeLoading(-1, managed.definition.id);
        }
        managed.abortController = undefined;
        managed.loadGeneration += 1;
        managed.bypassCache = refreshOptions?.bypassCache ?? false;
        if (managed.bypassCache) clearDataSourceCache(managed.definition);
        updateLayerState(managed.definition.id, { status: 'idle', progress: undefined, error: undefined });
        if (managed.layer.getVisible()) ensureLayerLoaded(managed);
      }
    },
    updateSize: () => {
      if (!destroyed) map.updateSize();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (visibleFeaturesTimer) clearTimeout(visibleFeaturesTimer);
      listenerKeys.forEach(unByKey);
      listenerKeys.length = 0;
      removeDataSources();
      popupOverlay?.setPosition(undefined);
      if (popupOverlay) map.removeOverlay(popupOverlay);
      protectedAreaLayer?.getSource()?.clear();
      routePositionSource.clear(true);
      baseSource.clear();
      map.setTarget(undefined);
      state = { ...state, status: 'idle', visibleTrailheadIds: [] };
    },
  };

  return controller;
}

export function lonLatView(longitude: number, latitude: number, zoom: number): TrailheadMapView {
  const center = fromLonLat([longitude, latitude]);
  return { center: [center[0], center[1]], zoom };
}
