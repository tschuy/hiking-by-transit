import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkAssets } from '../scripts/check-assets.mjs'

const fixtureAssets = fileURLToPath(new URL('./fixtures/assets/', import.meta.url))

test('accepts the complete baseline fixture', async () => {
  const result = await checkAssets({
    configPath: path.join(fixtureAssets, 'data/config.json'),
    assetsPath: fixtureAssets,
    manifestPath: path.join(fixtureAssets, 'manifest.json'),
  })

  assert.deepEqual(result.errors, [])
  assert.equal(result.feeds, 1)
  assert.equal(result.checkedAssets, 4)
})

test('reports unknown feeds and missing assets with their identifiers', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'olmap-assets-'))
  const configPath = path.join(directory, 'config.json')
  await writeFile(configPath, JSON.stringify({
    schema_version: 'legacy-1',
    data_version: 'broken-fixture',
    feeds: {},
    feed_groups: { broken: { members: ['missing-feed'] } },
    kml_groups: { generated: { missing_layer: { name: 'Missing layer' } } },
  }))

  const result = await checkAssets({ configPath, assetsPath: directory })

  assert(result.errors.includes('feed_groups.broken references unknown feed "missing-feed"'))
  assert(result.errors.includes('missing asset: kml/missing_layer.kml'))
})
