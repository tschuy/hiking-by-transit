# Legacy baseline contract

This document records the imported `hbt` behavior before controller extraction.
It is a compatibility reference, not the desired public API.

The baseline was imported from `hiking-by-transit` commit
`f470a52042ee60e349637b746969efaf0c8b48e7`. The authored import initially
matched that source byte-for-byte; subsequent Phase 0 changes are limited to
instrumentation, validation, documentation, fixtures, and debug-log gating.

## Runtime inputs

- The module executes immediately and fetches `/assets/data/config.json`.
- `window.hikes_with_gpx` must exist before module evaluation. Each item supplies
  `title`, `url`, `gpx`, `blurb`, `length`, `difficultyhuman`, and `difficulty`.
- The page must provide `ol-map`, `info`, `popup`, `popup-content`,
  `popup-directions-link`, `popup-alltrails-link`, `popup-hike-link`,
  `popup-closer`, `filter-form`, and `filter-layers-form` IDs.
- `ol-map` may provide `data-lon`, `data-lat`, and `data-zoom`. The fallback view
  is EPSG:3857 center `[-13611974.488458559, 4558011.3361273315]`, zoom 9.
- The optional `localStorage.osmmapurl` value overrides the base tile URL.
- Setting `localStorage.olmap-debug` to `true` enables diagnostic logging.

## Asset and configuration contract

- Every feed key maps to `/assets/geojson/<feed>.geojson`.
- The protected-area polygon layer is
  `/assets/geojson/southern_california.geojson`.
- Every hardcoded/generated KML group key maps to `/assets/kml/<key>.kml`.
- Every hike `gpx` value maps to `/assets/gpx/<value>`.
- Configuration uses snake_case JSON and is validated and normalized to the
  exported camelCase `ConfigFile` contract after fetch.
- `schema_version` identifies the data contract; `data_version` identifies the
  generated dataset. The canonical imported dataset is `legacy-1` / `2026-07-21`.
- The map target exposes `data-olmap-version`, `data-olmap-schema-version`, and
  `data-olmap-data-version` after initialization so deployed bundles and datasets
  can be identified together.
- Feed groups marked `hidden` start with their transit layers hidden. KML
  visibility follows OpenLayers defaults and is then driven by the host forms.
- The CPAD ArcGIS layer starts hidden. Its attribution is appended only while
  the layer is enabled.

## Side effects and lifecycle

The `olmap/legacy` compatibility entry retains the imported top-level behavior:
it queries the fixed DOM contract, reads browser globals, and renders legacy
popup/filter UI. As of Phase 2 it translates those inputs into the shared
controller and exposes `legacyController`, whose `destroy()` also removes the
adapter's listeners. The default `olmap` entry has no top-level map side effects.

## External requests

- The compatibility adapter now uses credential-free OpenStreetMap tiles by
  default in every environment; `localStorage.osmmapurl` can still override it.
- CPAD tiles come from the California Natural Resources Agency ArcGIS service.
- Transit, KML, GPX, and configuration assets are same-origin requests.

The imported production tile credential was removed in Phase 4. Production
providers now require an injected restricted browser URL or a same-origin
proxy; package output contains no provider credential.

## Known baseline defects

- The imported TypeScript defects captured in
  [`TYPECHECK_BASELINE.md`](./TYPECHECK_BASELINE.md) were resolved in Phase 1.
- The imported unsafe popup interpolation and global default-style selectors
  were removed in Phase 3. The optional legacy renderer constructs text nodes.
- Fixed IDs and hardcoded compatibility asset paths remain only in the legacy
  adapter; tile configuration is injected and the default controller supports
  safe multiple instances and route remounting.
- Phase 4 exposes per-layer progress, unavailable and partial-error states,
  cancellation, lazy optional transit loading, and retryable refresh commands.

## Manual parity checklist

- [ ] Map initializes at the fallback view and at supplied lon/lat/zoom values.
- [ ] Desktop drag works; wheel zoom requires Ctrl/Command.
- [ ] Mobile drag requires two pointers.
- [ ] Trailhead, stop, route, hike, and protected-area hover/click paths render.
- [ ] Directions, hike-guide, and AllTrails links match the selected feature.
- [ ] Every trailhead checkbox toggles its KML layer.
- [ ] Every transit group toggles all configured member feeds.
- [ ] CPAD visibility also updates tile attribution.
- [ ] Hidden feed groups remain hidden until enabled.
- [ ] A Tahoe-scoped host can initialize its intended view and layer selection.
- [ ] Missing one optional data source does not crash already rendered layers.
- [ ] Layout remains usable at 375px, 768px, and 1440px.
