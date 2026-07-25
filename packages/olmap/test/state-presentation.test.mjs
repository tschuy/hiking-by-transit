import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFeatureActions,
  collectVisibleFeatures,
  createStableFeatureId,
  dataSourceMatchesFilters,
  featureMatchesFilters,
  mergeFilters,
  normalizeFeatureDetails,
  normalizeFeatureSummary,
} from '../dist/index.js';

const filters = {
  accessModes: ['bus'],
  maximumWalkMinutes: 20,
  serviceDays: ['weekend'],
  reservationRequired: false,
};

test('evaluates source and feature filters without constructing a map', () => {
  assert.equal(dataSourceMatchesFilters({ id: 'bus-far', kind: 'kml', role: 'trailhead' }, filters), true);
  assert.equal(dataSourceMatchesFilters({ id: 'rail', kind: 'kml', role: 'trailhead' }, filters), false);
  assert.equal(featureMatchesFilters({
    id: 'one', name: 'One', sourceId: 'bus', visibleOnMap: true,
    properties: { walk_minutes: 12, service_days: 'weekday,weekend', reservation_required: false },
  }, filters), true);
  assert.equal(featureMatchesFilters({
    id: 'two', name: 'Two', sourceId: 'bus', visibleOnMap: true,
    properties: { walk_minutes: 30, service_days: 'weekend', reservation_required: false },
  }, filters), false);
});

test('merges filters without retaining caller-owned arrays', () => {
  const modes = ['rail'];
  const merged = mergeFilters({ accessModes: ['bus'], placeSlugs: ['bay-area'] }, { accessModes: modes });
  modes.push('ferry');
  assert.deepEqual(merged.accessModes, ['rail']);
  assert.deepEqual(merged.placeSlugs, ['bay-area']);
});

test('orders visible results deterministically, limits them, and retains selection', () => {
  const result = collectVisibleFeatures([
    { id: 'b', name: 'Beta', sourceId: 'bus', visibleOnMap: true, properties: {} },
    { id: 'a2', name: 'Alpha', sourceId: 'bus', visibleOnMap: true, properties: {} },
    { id: 'a1', name: 'Alpha', sourceId: 'bus', visibleOnMap: true, properties: {} },
    { id: 'hidden', name: 'Hidden', sourceId: 'bus', visibleOnMap: false, properties: {} },
  ], { accessModes: [] }, 'b', 2);
  assert.deepEqual(result.ids, ['a1', 'a2', 'b']);
  assert.equal(result.total, 3);
  assert.equal(result.limited, true);
  assert.equal(result.features.find((feature) => feature.id === 'hidden').visibleOnMap, false);
  assert.equal(result.features.find((feature) => feature.id === 'b').selected, true);
});

test('creates stable source-scoped IDs and structured serializable details', () => {
  assert.equal(createStableFeatureId('feed', { stop_id: '123' }), 'feed:123');
  assert.equal(
    createStableFeatureId('trailheads', { name: 'Mount Tam: Pantoll' }, [10, 20]),
    'trailheads:mount-tam-pantoll:10.00:20.00',
  );
  const details = normalizeFeatureDetails({
    id: 'trailheads:123', kind: 'trailhead', sourceId: 'trailheads', coordinate: [1, 2],
    longitudeLatitude: [-122.5, 37.8],
    properties: {
      name: 'Fixture Trailhead',
      description: '<script>not rendered by the core</script>',
      official_url: 'https://example.test/trailhead',
      ignored: { nested: true },
    },
  });
  assert.equal(details.name, 'Fixture Trailhead');
  assert.equal(details.properties.ignored, undefined);
  assert(details.actions.some((action) => action.kind === 'directions'));
  assert(details.actions.some((action) => action.kind === 'nearby-trails'));
  assert(!details.actions.some((action) => action.kind === 'official-source'));
  assert.doesNotThrow(() => JSON.stringify(details));
});

test('does not create geographic actions without coordinates', () => {
  assert.deepEqual(buildFeatureActions({ id: 'area', kind: 'protected-area', sourceId: 'areas', properties: {} }), []);
});

test('limits map links to the relevant feature types', () => {
  const trailheadActions = buildFeatureActions({
    id: 'trailhead', kind: 'trailhead', sourceId: 'bus', longitudeLatitude: [-122, 38],
    properties: { url: '/hikes/not-a-trailhead-action', official_url: 'https://example.test' },
  });
  assert.deepEqual(trailheadActions.map((action) => action.kind), ['directions', 'nearby-trails']);
  assert.deepEqual(buildFeatureActions({
    id: 'hike', kind: 'hike', sourceId: 'hikes', longitudeLatitude: [-122, 38], properties: { url: '/hikes/example' },
  }), [{ kind: 'hike-guide', label: 'Read hike guide', url: '/hikes/example' }]);
  assert.deepEqual(buildFeatureActions({
    id: 'stop', kind: 'transit-stop', sourceId: 'transit', longitudeLatitude: [-122, 38], properties: { official_url: 'https://example.test' },
  }), []);
});

test('exposes serializable cluster membership in presentation state', () => {
  assert.deepEqual(normalizeFeatureSummary({
    id: 'trailheads:cluster:a|b',
    kind: 'cluster',
    sourceId: 'trailheads',
    coordinate: [10, 20],
    properties: {
      name: '2 trailheads',
      clusterSize: 2,
      clusterMemberIds: ['a', 'b'],
    },
  }), {
    id: 'trailheads:cluster:a|b',
    kind: 'cluster',
    name: '2 trailheads',
    coordinate: [10, 20],
    sourceId: 'trailheads',
    clusterSize: 2,
    clusterMemberIds: ['a', 'b'],
  });
});
