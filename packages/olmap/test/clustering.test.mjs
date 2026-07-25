import assert from 'node:assert/strict';
import test from 'node:test';
import { createClusterId, sortedClusterMemberIds } from '../dist/index.js';

test('cluster identity is deterministic, source-scoped, and deduplicated', () => {
  const first = createClusterId({ sourceId: 'trailheads', memberIds: ['c', 'a', 'b', 'a'] });
  const second = createClusterId({ sourceId: 'trailheads', memberIds: ['b', 'c', 'a'] });

  assert.equal(first, 'trailheads:cluster:a|b|c');
  assert.equal(first, second);
  assert.notEqual(first, createClusterId({ sourceId: 'other', memberIds: ['a', 'b', 'c'] }));
  assert.deepEqual(sortedClusterMemberIds(['z', 'a', 'z']), ['a', 'z']);
});
