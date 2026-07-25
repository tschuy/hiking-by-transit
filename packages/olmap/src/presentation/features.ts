import type {
  Coordinate,
  MapAction,
  MapFeatureDetails,
  MapFeatureKind,
  MapFeatureSummary,
} from '../core/types';

export interface FeaturePresentationInput {
  id: string;
  kind: MapFeatureKind;
  sourceId: string;
  coordinate?: Coordinate;
  longitudeLatitude?: Coordinate;
  properties: Record<string, unknown>;
}

export function normalizeFeatureProperties(properties: Record<string, unknown>): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, string | number | boolean | null] => {
      const value = entry[1];
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null;
    }),
  );
}

export function createStableFeatureId(
  sourceId: string,
  properties: Record<string, unknown>,
  coordinate?: Coordinate,
  fallbackIndex = 0,
): string {
  const explicit = properties.id
    ?? properties.trailhead_id
    ?? properties.stop_id
    ?? properties.route_id
    ?? properties.slug;
  if (typeof explicit === 'string' || typeof explicit === 'number') return `${sourceId}:${String(explicit)}`;
  const name = properties.name ?? properties.stop_name ?? properties.title;
  if (typeof name === 'string' && name.trim()) {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const coordinateKey = coordinate?.map((value) => value.toFixed(2)).join(':');
    return `${sourceId}:${slug}${coordinateKey ? `:${coordinateKey}` : ''}`;
  }
  return `${sourceId}:feature-${fallbackIndex}`;
}

function featureName(properties: Record<string, unknown>, sourceId: string): string {
  return String(
    properties.name
      ?? properties.stop_name
      ?? properties.route_short_name
      ?? properties.route_long_name
      ?? properties.title
      ?? sourceId,
  );
}

export function buildFeatureActions(input: FeaturePresentationInput): MapAction[] {
  const actions: MapAction[] = [];
  const [longitude, latitude] = input.longitudeLatitude ?? [];
  if (longitude !== undefined && latitude !== undefined && input.kind === 'trailhead') {
    actions.push({
      kind: 'directions',
      label: 'Open in Maps',
      url: `https://www.google.com/maps/place/${latitude},${longitude}/@${latitude},${longitude},15z`,
    });
    const params = new URLSearchParams({
      b_tl_lat: String(latitude + 0.01),
      b_tl_lng: String(longitude - 0.012),
      b_br_lat: String(latitude - 0.01),
      b_br_lng: String(longitude + 0.012),
    });
    actions.push({ kind: 'nearby-trails', label: 'Open in AllTrails', url: `https://www.alltrails.com/explore?${params}` });
  }
  const hikeUrl = input.properties.url ?? input.properties.hike_url;
  if (input.kind === 'hike' && typeof hikeUrl === 'string' && hikeUrl) {
    actions.push({ kind: 'hike-guide', label: 'Read hike guide', url: hikeUrl });
  }
  return actions;
}

export function normalizeFeatureSummary(input: FeaturePresentationInput): MapFeatureSummary {
  return {
    id: input.id,
    kind: input.kind,
    name: featureName(input.properties, input.sourceId),
    coordinate: input.coordinate,
    sourceId: input.sourceId,
    clusterSize: typeof input.properties.clusterSize === 'number' ? input.properties.clusterSize : undefined,
    clusterMemberIds: Array.isArray(input.properties.clusterMemberIds)
      ? input.properties.clusterMemberIds.filter((id): id is string => typeof id === 'string')
      : undefined,
  };
}

export function normalizeFeatureDetails(input: FeaturePresentationInput): MapFeatureDetails {
  const properties = normalizeFeatureProperties(input.properties);
  return {
    ...normalizeFeatureSummary(input),
    description: typeof input.properties.description === 'string'
      ? input.properties.description
      : typeof input.properties.blurb === 'string'
        ? input.properties.blurb
        : undefined,
    actions: buildFeatureActions(input),
    properties,
  };
}
