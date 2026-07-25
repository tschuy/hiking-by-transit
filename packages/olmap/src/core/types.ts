import type { ConfigFile } from '../config/schema';
import type { SourceMetadata } from '../data/types';

export type Coordinate = [number, number];
export type Extent = [number, number, number, number];

export interface TrailheadMapView {
  center: Coordinate;
  zoom: number;
  extent?: Extent;
}

export type AccessMode =
  | 'bus'
  | 'rail'
  | 'ferry'
  | 'shuttle'
  | 'microtransit'
  | 'call-ahead';

export interface TrailheadMapFilters {
  accessModes: AccessMode[];
  maximumWalkMinutes?: number;
  serviceDays?: Array<'weekday' | 'weekend'>;
  seasonalService?: boolean;
  reservationRequired?: boolean;
  hasHikeGuide?: boolean;
  placeSlugs?: string[];
  transitGroups?: string[];
  showProtectedAreas?: boolean;
}

export interface TrailheadMapState {
  view: TrailheadMapView;
  filters: TrailheadMapFilters;
  selectedFeatureId?: string;
  visibleTrailheadIds: string[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  layers: Record<string, LayerLoadState>;
}

export interface VisibleFeatureState {
  id: string;
  name: string;
  sourceId: string;
  visibleOnMap: boolean;
  matchesFilters: boolean;
  selected: boolean;
}

export interface VisibleFeatureResult {
  ids: string[];
  total: number;
  limited: boolean;
  features: VisibleFeatureState[];
}

export interface MapHike {
  id: string;
  slug: string;
  title: string;
  gpx: string;
  url: string;
  blurb?: string;
  length?: string;
  difficulty?: string;
  difficultyLabel?: string;
}

export type MapFeatureKind =
  | 'trailhead'
  | 'transit-stop'
  | 'transit-route'
  | 'hike'
  | 'protected-area'
  | 'cluster';

export interface MapFeatureSummary {
  id: string;
  kind: MapFeatureKind;
  name: string;
  coordinate?: Coordinate;
  sourceId: string;
  clusterSize?: number;
  clusterMemberIds?: string[];
}

export interface MapAction {
  kind: 'directions' | 'hike-guide' | 'nearby-trails';
  label: string;
  url: string;
}

export interface MapFeatureDetails extends MapFeatureSummary {
  description?: string;
  actions: MapAction[];
  properties: Record<string, string | number | boolean | null>;
}

export interface MapDataSource {
  id: string;
  kind: 'geojson' | 'kml' | 'gpx' | 'vector-tile';
  role: 'transit' | 'trailhead' | 'hike' | 'protected-area';
  url?: string;
  load?: (signal: AbortSignal, reportProgress: (progress: SourceLoadProgress) => void) => Promise<unknown | DataSourceLoadResult>;
  attribution?: string;
  version?: string;
  cacheKey?: string;
  cachePolicy?: 'none' | 'memory';
  sourceUrl?: string;
  generatedAt?: string;
  freshnessDate?: string;
  unavailableReason?: string;
  visible?: boolean;
  groupIds?: string[];
  hikeId?: string;
  clustering?: boolean | Partial<ClusteringOptions>;
}

export interface ClusteringOptions {
  enabled: boolean;
  distance: number;
  minZoom: number;
  maxZoom: number;
  sourceIds?: string[];
  expansionZoomDelta: number;
}

export interface DataSourceLoadResult {
  data: unknown;
  metadata?: Partial<SourceMetadata>;
}

export interface SourceLoadProgress {
  phase: 'queued' | 'fetching' | 'parsing' | 'complete';
  loadedBytes?: number;
  totalBytes?: number;
  fraction?: number;
}

export interface LayerLoadState {
  sourceId: string;
  status: 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';
  progress?: SourceLoadProgress;
  metadata?: SourceMetadata;
  error?: TrailheadMapError;
}

export interface TileSourceOptions {
  url: string;
  attribution: string | string[];
  maxZoom?: number;
}

export interface ProtectedAreaTileSourceOptions extends TileSourceOptions {
  params?: Record<string, string>;
  opacity?: number;
}

export interface TrailheadMapOptions {
  target: HTMLElement;
  config: ConfigFile;
  dataSources: MapDataSource[];
  tileSource: TileSourceOptions;
  protectedAreaTileSource?: ProtectedAreaTileSourceOptions;
  hikes?: MapHike[];
  initialView?: Partial<TrailheadMapView>;
  initialFilters?: Partial<TrailheadMapFilters>;
  initialSelectedFeatureId?: string;
  popupElement?: HTMLElement;
  visibleFeatureLimit?: number;
  visibleFeaturesDebounceMs?: number;
  reducedMotion?: boolean;
  clustering?: Partial<ClusteringOptions>;
  onEvent?: (event: TrailheadMapEvent) => void;
}

export interface TrailheadMapError {
  code: 'config' | 'tile' | 'geojson' | 'kml' | 'gpx' | 'protected-area' | 'unknown';
  message: string;
  sourceId?: string;
  retryable: boolean;
}

export type TrailheadMapEvent =
  | { type: 'ready'; state: TrailheadMapState }
  | { type: 'loading-change'; loading: boolean; sourceId?: string }
  | { type: 'layer-progress'; layer: LayerLoadState }
  | { type: 'error'; error: TrailheadMapError }
  | { type: 'view-change'; view: TrailheadMapView }
  | { type: 'move-end'; view: TrailheadMapView }
  | { type: 'filters-change'; filters: TrailheadMapFilters }
  | ({ type: 'visible-features-change' } & VisibleFeatureResult)
  | { type: 'feature-hover'; feature?: MapFeatureSummary; pixel?: Coordinate }
  | { type: 'feature-select'; feature: MapFeatureDetails }
  | { type: 'selection-clear' }
  | { type: 'layer-visibility-change'; layerId: string; visible: boolean };

export interface FitToExtentOptions {
  padding?: [number, number, number, number];
  maxZoom?: number;
  durationMs?: number;
}

export interface TrailheadMapController {
  readonly ready: Promise<void>;
  getState(): TrailheadMapState;
  setFilters(filters: Partial<TrailheadMapFilters>): void;
  setView(view: Partial<TrailheadMapView>): void;
  fitToExtent(extent: Extent, options?: FitToExtentOptions): void;
  selectFeature(id: string): void;
  activateFeature(id: string): void;
  clearSelection(): void;
  setHikes(hikes: MapHike[]): void;
  setDataSources(sources: MapDataSource[]): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  refresh(options?: RefreshOptions): void;
  updateSize(): void;
  destroy(): void;
}

export interface RefreshOptions {
  sourceIds?: string[];
  bypassCache?: boolean;
}
