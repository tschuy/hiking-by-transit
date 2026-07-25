import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearDataSourceCache,
  DataSourceUnavailableError,
  getDataSourceCacheSize,
  loadDataSource,
  normalizeSourceProperties,
} from '../dist/index.js';

test.beforeEach(() => clearDataSourceCache());

test('loads custom sources through the versioned memory cache', async () => {
  let calls = 0;
  const source = {
    id: 'fixture',
    kind: 'geojson',
    role: 'trailhead',
    version: '2026-07-25',
    cachePolicy: 'memory',
    load: async () => {
      calls += 1;
      return { type: 'FeatureCollection', features: [] };
    },
  };

  await loadDataSource(source, new AbortController().signal);
  await loadDataSource(source, new AbortController().signal);
  assert.equal(calls, 1);
  assert.equal(getDataSourceCacheSize(), 1);

  clearDataSourceCache(source);
  await loadDataSource(source, new AbortController().signal);
  assert.equal(calls, 2);
});

test('reports progress and combines declared and loader metadata', async () => {
  const progress = [];
  const loaded = await loadDataSource({
    id: 'metadata-fixture',
    kind: 'geojson',
    role: 'trailhead',
    sourceUrl: 'https://agency.example/source',
    attribution: 'Fixture agency',
    version: 'v1',
    load: async (_signal, reportProgress) => {
      reportProgress({ phase: 'fetching', loadedBytes: 4, totalBytes: 8, fraction: 0.5 });
      return {
        data: { type: 'FeatureCollection', features: [] },
        metadata: { freshnessDate: '2026-07-24', version: 'v2' },
      };
    },
  }, new AbortController().signal, (event) => progress.push(event));

  assert.deepEqual(progress.map(({ phase }) => phase), ['queued', 'fetching', 'parsing', 'complete']);
  assert.deepEqual(loaded.metadata, {
    sourceId: 'metadata-fixture',
    sourceUrl: 'https://agency.example/source',
    attribution: 'Fixture agency',
    generatedAt: undefined,
    version: 'v2',
    freshnessDate: '2026-07-24',
  });
});

test('makes unavailable and aborted sources explicit', async () => {
  await assert.rejects(
    loadDataSource({
      id: 'missing-feed',
      kind: 'geojson',
      role: 'transit',
      unavailableReason: 'not published for this region',
    }, new AbortController().signal),
    (error) => error instanceof DataSourceUnavailableError && error.sourceId === 'missing-feed',
  );

  const abortController = new AbortController();
  abortController.abort();
  await assert.rejects(
    loadDataSource({
      id: 'aborted-feed',
      kind: 'geojson',
      role: 'transit',
      load: async () => ({ type: 'FeatureCollection', features: [] }),
    }, abortController.signal),
    (error) => error?.name === 'AbortError',
  );
});

test('normalizes aliases and source metadata at the loading boundary', () => {
  assert.deepEqual(normalizeSourceProperties({
    stop_name: 'Trailhead shuttle',
    desc: 'Weekend service',
    official_url: 'https://agency.example/stop',
  }, {
    sourceId: 'transit-feed',
    sourceUrl: 'https://agency.example/feed',
    attribution: 'Fixture agency',
    version: 'v3',
  }), {
    stop_name: 'Trailhead shuttle',
    desc: 'Weekend service',
    official_url: 'https://agency.example/stop',
    name: 'Trailhead shuttle',
    description: 'Weekend service',
    source_id: 'transit-feed',
    source_url: 'https://agency.example/stop',
    source_attribution: 'Fixture agency',
    data_version: 'v3',
    generated_at: undefined,
    freshness_date: undefined,
  });
});
