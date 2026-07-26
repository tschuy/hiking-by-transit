import { describe, expect, it } from 'vitest'
import type { ConfigFile } from 'olmap'
import { createMapSources } from './sources'

const emptyConfig: ConfigFile = {
  schemaVersion: 'legacy-1',
  dataVersion: 'test',
  feeds: {},
  feedGroups: {},
  kmlGroups: { hardcoded: {}, generated: {} },
}

describe('map sources', () => {
  it('includes the Southern California regional resources overlay', () => {
    expect(createMapSources(emptyConfig, new Set())).toContainEqual(expect.objectContaining({
      id: 'southern-california',
      kind: 'geojson',
      role: 'protected-area',
      url: '/assets/geojson/southern_california.geojson',
      visible: true,
    }))
  })
})
