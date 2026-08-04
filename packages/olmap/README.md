# OpenLayers map

This is the canonical framework-independent Hiking by Transit map package. The
React application is its canonical consumer; the former static compatibility
consumer and precompiled-copy deployment path have been retired.

## Package entry points

- `olmap` — side-effect-free controller, configuration validation, pure state
  helpers, version constants, and public TypeScript contracts.
- `olmap/types` — explicit type-oriented alias for the public contracts.
- `olmap/styles/openlayers.css` — OpenLayers base styles.
- `olmap/styles/default.css` — optional scoped default styles.

The package emits ESM, TypeScript declarations and declaration maps, and
JavaScript source maps. React is not a dependency.

## Controller API

The default entry creates maps without querying the document or reading
application globals:

```ts
import { createTrailheadMap, validateConfig } from 'olmap'

const controller = createTrailheadMap({
  target: mapElement,
  config: validateConfig(configJson),
  dataSources,
  tileSource: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  hikes,
  initialView: { center: [-13611974, 4558011], zoom: 9 },
  initialFilters: { accessModes: ['bus', 'rail'] },
  visibleFeatureLimit: 100,
  visibleFeaturesDebounceMs: 100,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  onEvent: (event) => handleMapEvent(event),
})

await controller.ready
controller.setFilters({ showProtectedAreas: true })
controller.setView({ zoom: 10 })
controller.selectFeature('trailhead-id')
controller.activateFeature('trailheads:cluster:a|b|c')
controller.updateSize()
controller.destroy()
```

The controller also supports `fitToExtent`, `clearSelection`, `setHikes`,
`setDataSources`, `setLayerVisibility`, `refresh`, and serializable `getState`.
`destroy()` is idempotent and owns map listeners, overlays, layers, sources,
observers, and in-flight vector requests. Multiple controllers may coexist.

## Clustering and statewide results

Trailhead sources cluster by default from zoom 0 through 14 at a 55-pixel
distance. Configure that globally or override/disable it on a source:

```ts
createTrailheadMap({
  // ...
  clustering: {
    distance: 48,
    minZoom: 0,
    maxZoom: 12,
    sourceIds: ['bus', 'rail'],
    expansionZoomDelta: 2,
  },
})

const source = { ...trailheads, clustering: false }
```

Cluster IDs are deterministic from the sorted, source-scoped member IDs.
Hover and selection summaries expose `kind: 'cluster'`, `clusterSize`, and
`clusterMemberIds`. Pointer activation and `activateFeature(clusterId)` select
the cluster and fit its members, capped to the configured zoom increment;
`selectFeature` selects without changing the view. Above `maxZoom`, the layer
switches back to its indexed raw source.

Visible companion-list results always query the raw OpenLayers spatial index,
not rendered clusters, and remain bounded by `visibleFeatureLimit` while
reporting the complete matching total.

The statewide data profile supports the current lazy-feed design: trailhead
assets remain below their initial-load budget, while large transit feeds are
loaded only when enabled. The Bay Area transit feed should be partitioned or
parsed and indexed in a Worker before any future decision to load it eagerly.

## Data sources, progress, and recovery

Each `MapDataSource` supplies either a `url` or an abort-aware `load` function.
Static GeoJSON, KML, and GPX assets and application loaders therefore use the
same controller path. Optional transit sources can start with `visible: false`;
they are not requested until their source or group is enabled.

```ts
const source = {
  id: 'regional-transit',
  kind: 'geojson',
  role: 'transit',
  url: new URL('./regional-transit.geojson', import.meta.url).href,
  sourceUrl: 'https://transit.example/gtfs',
  attribution: 'Regional Transit',
  version: config.dataVersion,
  freshnessDate: '2026-07-24',
  cachePolicy: 'memory',
  visible: false,
} satisfies MapDataSource
```

`layer-progress` events and `getState().layers[sourceId]` expose queued,
fetching, parsing, ready, error, and unavailable states plus byte progress and
source metadata. Declare a known missing feed with `unavailableReason`; this is
distinct from a retryable request failure. A failure is isolated to its layer,
so other sources remain usable. Retry selected sources with
`controller.refresh({ sourceIds: ['regional-transit'] })`, or force fresh data
with `bypassCache: true`. Memory cache entries are keyed by `cacheKey` (or the
source URL/ID) plus `version` and can also be cleared with
`clearDataSourceCache()`.

Custom loaders receive an `AbortSignal` and progress reporter. They should stop
network and parsing work when aborted, and may return `{ data, metadata }` to
provide runtime freshness or generation details. Feature name, description,
official URL, and source metadata aliases are normalized once when features
enter the map.

## Tile services and privacy

Tile URLs and attribution are always injected into the core. No provider token
is shipped in the package. Production deployments with a commercial provider should use a
same-origin proxy, or a browser token restricted by origin, API, quota, and
rotation policy; never place an unrestricted secret in frontend code.

Map and feature data requests disclose the visitor's IP address and requested
geographic tile/asset path to their respective hosts. Prefer a same-origin tile
proxy when that disclosure is unsuitable, retain only necessary logs, and keep
provider attribution visible. The core has no fixed asset root.

Filters, feature normalization, stable ID generation, action generation, and
visible-result ordering are exported as pure functions. A
`visible-features-change` event contains deterministic limited IDs, the total
matching count, selection retention, and per-feature `visibleOnMap`,
`matchesFilters`, and `selected` state. Viewport emissions are debounced after
`moveend`; filter changes update map visibility and serializable state before
emitting host events.

The core never renders popup or filter markup. Hosts consume structured
`feature-hover`, `feature-select`, `features-select`, loading, error, filter,
and layer events. A pointer click emits `feature-select` for the active feature,
followed by `features-select` containing every distinct hit. Candidates are
ordered as trailheads or clusters, hikes, transit stops, transit routes, then
protected areas. Multiple geometries for the same transit `route_id` and source
are represented once. Programmatic selection emits only `feature-select`. The
application sanitizes any source description markup before rendering it.

Consumers of the optional default stylesheet must place the map and related UI
inside `.olmap-root` and apply `.olmap-map` to the target. All theme rules are
scoped beneath that root and can be customized with `--olmap-*` properties;
OpenLayers base CSS remains a separate import.

## React application integration

The canonical consumer is now `src/hooks/useTrailheadMap.ts`. It imports
this package through the local npm workspace, dynamically loads the runtime ESM
entry on map routes, constructs the controller from a mounted ref, and destroys
it in effect cleanup. React renders structured selection details, progress,
partial errors, retries, filters, and a paginated companion list. No map global,
fixed DOM ID, or injected bundle/stylesheet is used by the React path.

The adapter serializes validated center, zoom, layer, selection, and map/list
state into the URL and uses the same component for statewide and regional
scoped maps. The retired static consumer and compatibility entry were removed
in Phase 7.

Hike-page GPX embeds reuse the same controller with one injected GeoJSON hike
source. `setRoutePosition()` and `route-position-change` synchronize the map
with the host-owned elevation profile without placing chart concerns in the
framework-independent package.

## Development and verification

Run package commands from `packages/olmap`, or prefix them with
`npm --workspace olmap run` when working from the application root.

- `npm start` starts the package development server.
- `npm run typecheck` checks the public TypeScript contracts.
- `npm run check:assets` validates the canonical configuration and every
  referenced GeoJSON, KML, GPX, and marker asset.
- `npm run check:fixtures` validates the package's asset-checking fixtures.
- `npm run check:performance` enforces the package and data-size budgets.
- `npm test` runs the performance check and package test suite.
- `npm run build` creates the ESM library and TypeScript declarations.
- `npm run verify` runs all package asset, fixture, type, build, performance,
  and test checks.

The enforced performance budgets are 190,000 gzip bytes for the ESM library,
400,000 bytes for initial trailhead assets, and 250 records for companion-list
results. The application-level release command is `npm run verify`; it adds
linting, application unit tests, production and prerender builds, and Playwright
coverage at 375px, 768px, and 1440px. Manual parity, real touch-device behavior,
hike GPX maps, responsive layouts, and scoped place maps have also been
verified.
