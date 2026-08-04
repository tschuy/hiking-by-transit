import assert from 'node:assert/strict';
import test from 'node:test';
import { orderSelectedFeatures } from '../dist/index.js';

function feature(id, kind, sourceId = 'fixture', properties = {}) {
  return { id, kind, sourceId, name: id, actions: [], properties };
}

test('orders overlapping map features by interaction priority', () => {
  const features = orderSelectedFeatures([
    feature('area', 'protected-area'),
    feature('route', 'transit-route'),
    feature('stop', 'transit-stop'),
    feature('hike', 'hike'),
    feature('trailhead', 'trailhead'),
  ]);
  assert.deepEqual(features.map(({ id }) => id), ['trailhead', 'hike', 'stop', 'route', 'area']);
});

test('deduplicates route segments within a source while preserving separate sources', () => {
  const features = orderSelectedFeatures([
    feature('segment-a', 'transit-route', 'first', { route_id: '10' }),
    feature('segment-b', 'transit-route', 'first', { route_id: '10' }),
    feature('segment-c', 'transit-route', 'second', { route_id: '10' }),
  ]);
  assert.deepEqual(features.map(({ id }) => id), ['segment-a', 'segment-c']);
});

test('preserves source order among features with the same priority', () => {
  const features = orderSelectedFeatures([
    feature('second', 'trailhead'),
    feature('first', 'trailhead'),
  ]);
  assert.deepEqual(features.map(({ id }) => id), ['second', 'first']);
});
