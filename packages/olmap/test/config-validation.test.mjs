import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ConfigValidationError, validateConfig } from '../dist/index.js';

const validConfig = {
  schema_version: 'legacy-1',
  data_version: 'fixture-1',
  feeds: {
    fixture: {
      gtfs: { url: 'https://example.test/gtfs.zip', annotated_url: 'https://example.test/annotated.zip' },
      agencies: {
        agency: {
          type: 'bus',
          long_name: 'Fixture Transit',
          short_name: 'Fixture',
          routes: { hidden_route: { hidden: true } },
        },
      },
    },
  },
  feed_groups: {
    fixtures: { name: 'Fixtures', members: ['fixture'], hidden: true },
  },
  kml_groups: {
    hardcoded: { trailhead: { name: 'Fixture trailheads' } },
    generated: {},
  },
};

test('validates and normalizes snake-case configuration', () => {
  const config = validateConfig(validConfig);

  assert.equal(config.schemaVersion, 'legacy-1');
  assert.equal(config.feeds.fixture.gtfs.annotatedUrl, 'https://example.test/annotated.zip');
  assert.equal(config.feeds.fixture.agencies.agency.longName, 'Fixture Transit');
  assert.equal(config.feeds.fixture.agencies.agency.routes.hidden_route.hidden, true);
  assert.deepEqual(config.feedGroups.fixtures.members, ['fixture']);
});

test('validates the canonical generated configuration', async () => {
  const source = await readFile(new URL('../../../public/assets/data/config.json', import.meta.url), 'utf8');
  const config = validateConfig(JSON.parse(source));

  assert.equal(config.schemaVersion, 'legacy-1');
  assert.equal(Object.keys(config.feeds).length, 40);
});

test('reports actionable paths for invalid feed references and fields', () => {
  const invalid = structuredClone(validConfig);
  invalid.feeds.fixture.agencies.agency.long_name = '';
  invalid.feed_groups.fixtures.members = ['missing'];

  assert.throws(
    () => validateConfig(invalid),
    (error) => {
      assert(error instanceof ConfigValidationError);
      assert(error.issues.some((issue) => issue.path === 'feeds.fixture.agencies.agency.long_name'));
      assert(error.issues.some((issue) => issue.path === 'feed_groups.fixtures.members' && issue.message.includes('missing')));
      return true;
    },
  );
});
