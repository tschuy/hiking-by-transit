import type { MapFeatureDetails, MapFeatureKind } from './types';

const FEATURE_SELECTION_PRIORITY: Record<MapFeatureKind, number> = {
  trailhead: 0,
  cluster: 0,
  hike: 1,
  'transit-stop': 2,
  'transit-route': 3,
  'protected-area': 4,
};

function selectionKey(feature: MapFeatureDetails): string {
  const routeId = feature.properties.route_id;
  if (feature.kind === 'transit-route' && (typeof routeId === 'string' || typeof routeId === 'number')) {
    return `${feature.sourceId}:route:${String(routeId)}`;
  }
  return feature.id;
}

export function orderSelectedFeatures(features: MapFeatureDetails[]): MapFeatureDetails[] {
  const unique = new globalThis.Map<string, { feature: MapFeatureDetails; index: number }>();
  features.forEach((feature, index) => {
    const key = selectionKey(feature);
    if (!unique.has(key)) unique.set(key, { feature, index });
  });
  return [...unique.values()]
    .sort((left, right) => FEATURE_SELECTION_PRIORITY[left.feature.kind] - FEATURE_SELECTION_PRIORITY[right.feature.kind]
      || left.index - right.index)
    .map(({ feature }) => feature);
}
