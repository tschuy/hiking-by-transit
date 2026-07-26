import type {
  AccessMode,
  MapDataSource,
  TrailheadMapFilters,
  VisibleFeatureResult,
  VisibleFeatureState,
} from './types';

export interface FilterableFeature {
  id: string;
  name: string;
  sourceId: string;
  properties: Record<string, string | number | boolean | null>;
  visibleOnMap: boolean;
}

const SOURCE_ACCESS_MODES: Record<string, AccessMode[]> = {
  bus: ['bus'],
  'bus-far': ['bus'],
  'bus-weekday-only': ['bus'],
  rail: ['rail', 'ferry'],
  'rail-far': ['rail', 'ferry'],
  shuttles: ['shuttle'],
  microtransit: ['microtransit'],
  'call-ahead': ['call-ahead'],
};

function booleanProperty(properties: FilterableFeature['properties'], ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string' && ['true', 'yes', '1'].includes(value.toLowerCase())) return true;
    if (typeof value === 'string' && ['false', 'no', '0'].includes(value.toLowerCase())) return false;
  }
  return undefined;
}

function numberProperty(properties: FilterableFeature['properties'], ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = properties[key];
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

function listProperty(properties: FilterableFeature['properties'], ...keys: string[]): string[] {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string') return value.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function mergeFilters(current: TrailheadMapFilters, update: Partial<TrailheadMapFilters>): TrailheadMapFilters {
  return {
    ...current,
    ...update,
    accessModes: update.accessModes ? [...update.accessModes] : [...current.accessModes],
    serviceDays: update.serviceDays ? [...update.serviceDays] : current.serviceDays ? [...current.serviceDays] : undefined,
    placeSlugs: update.placeSlugs ? [...update.placeSlugs] : current.placeSlugs ? [...current.placeSlugs] : undefined,
    transitGroups: update.transitGroups ? [...update.transitGroups] : current.transitGroups ? [...current.transitGroups] : undefined,
  };
}

export function cloneFilters(filters: TrailheadMapFilters): TrailheadMapFilters {
  return mergeFilters({ accessModes: [] }, filters);
}

export function dataSourceMatchesFilters(definition: MapDataSource, filters: TrailheadMapFilters): boolean {
  if (definition.role === 'trailhead' && filters.accessModes.length > 0) {
    const sourceModes = SOURCE_ACCESS_MODES[definition.id] ?? [];
    if (!filters.accessModes.some((mode) => sourceModes.includes(mode))) return false;
  }
  if (definition.role === 'transit' && filters.transitGroups) {
    return (definition.groupIds ?? []).some((groupId) => filters.transitGroups?.includes(groupId));
  }
  return true;
}

export function featureMatchesFilters(feature: FilterableFeature, filters: TrailheadMapFilters): boolean {
  const { properties } = feature;
  if (filters.maximumWalkMinutes !== undefined) {
    const minutes = numberProperty(properties, 'walk_minutes', 'walkMinutes', 'maximum_walk_minutes');
    if (minutes !== undefined && minutes > filters.maximumWalkMinutes) return false;
  }
  if (filters.serviceDays?.length) {
    const days = listProperty(properties, 'service_days', 'serviceDays');
    if (!filters.serviceDays.some((day) => day === 'weekend' ? days.includes('weekend') || days.includes('saturday') || days.includes('sunday') : days.includes(day))) return false;
  }
  if (filters.seasonalService !== undefined) {
    const seasonal = booleanProperty(properties, 'seasonal_service', 'seasonalService', 'seasonal');
    if (filters.seasonalService === 'unknown' ? seasonal !== undefined : seasonal !== filters.seasonalService) return false;
  }
  if (filters.reservationRequired !== undefined) {
    const reservation = booleanProperty(properties, 'reservation_required', 'reservationRequired');
    if (filters.reservationRequired === 'unknown' ? reservation !== undefined : reservation !== filters.reservationRequired) return false;
  }
  if (filters.hasHikeGuide !== undefined) {
    const hasGuide = booleanProperty(properties, 'has_hike_guide', 'hasHikeGuide') ?? typeof properties.hike_slug === 'string';
    if (hasGuide !== filters.hasHikeGuide) return false;
  }
  if (filters.placeSlugs?.length) {
    const places = listProperty(properties, 'place_slugs', 'placeSlugs', 'place_slug');
    if (!filters.placeSlugs.some((slug) => places.includes(slug))) return false;
  }
  return true;
}

export function collectVisibleFeatures(
  features: FilterableFeature[],
  filters: TrailheadMapFilters,
  selectedFeatureId?: string,
  limit = 250,
): VisibleFeatureResult {
  const states: VisibleFeatureState[] = features
    .map((feature) => ({
      id: feature.id,
      name: feature.name,
      sourceId: feature.sourceId,
      visibleOnMap: feature.visibleOnMap,
      matchesFilters: featureMatchesFilters(feature, filters),
      selected: feature.id === selectedFeatureId,
    }))
    .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
  const matching = states.filter((feature) => feature.visibleOnMap && feature.matchesFilters);
  const ids = matching.slice(0, Math.max(0, limit)).map((feature) => feature.id);
  if (selectedFeatureId && !ids.includes(selectedFeatureId)) ids.push(selectedFeatureId);
  return {
    ids,
    total: matching.length,
    limited: matching.length > limit,
    features: states,
  };
}
