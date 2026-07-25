# OpenLayers map

This is the canonical copy of the legacy Hiking by Transit map module. See
[`BASELINE.md`](./BASELINE.md) for its current runtime contract and
[`MODERNIZATION_PLAN.md`](./MODERNIZATION_PLAN.md) for the staged replacement.

## Package entry points

- `olmap` — side-effect-free configuration validation, version constants, and
  public TypeScript contracts for the future controller.
- `olmap/types` — explicit type-oriented alias for the public contracts.
- `olmap/dom` — optional text-only, injection-safe legacy popup renderer.
- `olmap/legacy` — compatibility bootstrap with the existing DOM/global
  contract and top-level initialization.
- `olmap/styles/openlayers.css` — OpenLayers base styles.
- `olmap/styles/default.css` — optional legacy application styles.

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
reporting the complete matching total. See
[`PERFORMANCE.md`](./PERFORMANCE.md) for statewide measurements, cache policy,
budgets, and the Worker/partitioning decision.

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

Tile URLs and attribution are always injected into the core. The legacy adapter
now defaults to credential-free OpenStreetMap tiles and still accepts its
historical `localStorage.osmmapurl` override. No provider token is shipped in
the package. Production deployments with a commercial provider should use a
same-origin proxy, or a browser token restricted by origin, API, quota, and
rotation policy; never place an unrestricted secret in frontend code.

Map and feature data requests disclose the visitor's IP address and requested
geographic tile/asset path to their respective hosts. Prefer a same-origin tile
proxy when that disclosure is unsuitable, retain only necessary logs, and keep
provider attribution visible. The legacy adapter's transit/KML/GPX paths remain
same-origin compatibility inputs; the core has no fixed asset root.

Filters, feature normalization, stable ID generation, action generation, and
visible-result ordering are exported as pure functions. A
`visible-features-change` event contains deterministic limited IDs, the total
matching count, selection retention, and per-feature `visibleOnMap`,
`matchesFilters`, and `selected` state. Viewport emissions are debounced after
`moveend`; filter changes update map visibility and serializable state before
emitting host events.

The core never renders popup or filter markup. Hosts consume structured
`feature-hover`, `feature-select`, loading, error, filter, and layer events. The
optional legacy renderer uses `textContent`-based DOM construction so source
descriptions cannot inject markup.

Consumers of the optional default stylesheet must place the map and related UI
inside `.olmap-root` and apply `.olmap-map` to the target. All theme rules are
scoped beneath that root and can be customized with `--olmap-*` properties;
OpenLayers base CSS remains a separate import.

The compatibility entry exports `bootstrapLegacyTrailheadMap()` and its
top-level `legacyController` promise for the existing Jekyll-style integration.

## React application integration

The canonical consumer is now `my-app/src/hooks/useTrailheadMap.ts`. It imports
this package through the local npm workspace, dynamically loads the runtime ESM
entry on map routes, constructs the controller from a mounted ref, and destroys
it in effect cleanup. React renders structured selection details, progress,
partial errors, retries, filters, and a paginated companion list. No map global,
fixed DOM ID, or injected bundle/stylesheet is used by the React path.

The adapter serializes validated center, zoom, layer, selection, and map/list
state into the URL and uses the same component for statewide and Tahoe-scoped
maps. The legacy entry remains available only for the older static consumer.

The map embed for Hiking by Transit is developed separately from the rest of the website, as it requires a proper
build toolchain.

To develop:

`npm start`

To validate configuration and referenced assets:

`npm run check:assets`

To run fixture checks and the compatibility build:

`npm run verify:baseline`

`npm run typecheck` checks both the public contracts and legacy bootstrap. The
imported diagnostics retained in [`TYPECHECK_BASELINE.md`](./TYPECHECK_BASELINE.md)
were resolved in Phase 1.

To update the main Hiking by Transit website:

`npm run build-and-deploy`
