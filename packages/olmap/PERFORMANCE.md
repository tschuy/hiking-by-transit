# Performance profile and budgets

Phase 5 establishes the first reproducible statewide baseline. Measurements
below were taken on 2026-07-25 with Node 22 on the repository's canonical
assets. They are engineering baselines, not promises about every browser or
device.

## Current dataset profile

| Measurement | Result | Decision |
| --- | ---: | --- |
| Transit GeoJSON files | 42 | Optional feeds remain visibility-loaded. |
| Transit GeoJSON bytes | 60,286,913 | Do not preload statewide transit. |
| Transit features | 33,168 | Keep raw features in OpenLayers spatial indexes. |
| Sequential JSON parse | 1,258.8 ms | Parsing all feeds on the main thread is outside budget. |
| Largest feed (`bayarea.geojson`) | 31,865,499 bytes / 20,545 features | Partition this feed or parse/index it in a Worker before enabling it by default. |
| Largest-feed JSON parse | 816.8 ms | A Worker is warranted for an eagerly loaded file of this size. |
| Process RSS after profile | 214,900,736 bytes | Avoid retaining duplicate parsed statewide copies. |
| All initial trailhead KML | 290,323 bytes | Fits the enforced 400,000-byte initial-data budget. |
| 33,168-row deterministic list reduction | 34.1 ms / 250 returned | The bounded host result contract stays below the 100 ms target in this synthetic baseline. |

The measurements justify the current lazy-feed design. They do not justify
shipping vector-tile complexity for trailheads, whose complete initial payload
is under budget. The oversized Bay Area transit source is the first candidate
for partitioning or Worker parsing if product behavior requires eager access;
until then, it remains optional and lazy.

## Budgets

Machine-enforced limits live in [`performance-budgets.json`](./performance-budgets.json).
`npm run check:performance` currently checks the limits that are stable in CI:

- library ESM gzip: 190,000 bytes;
- initial trailhead assets: 400,000 bytes;
- companion-list result limit: 250 records.

The host/browser integration should enforce these runtime targets once Phase 6
provides a real application adapter and browser harness:

- first usable map: at most 2,000 ms on a mid-tier mobile profile;
- `moveend` to `visible-features-change`: at most 100 ms at p95;
- no map task longer than 50 ms;
- less than 1 MiB retained after ten mount/destroy route transitions.

The controller already bounds visible results, debounces viewport work, queries
the raw `VectorSource` spatial index, aborts source work on destroy, and avoids
loading hidden transit feeds. Browser timings and heap snapshots belong in the
Phase 6/7 integration suite rather than a synthetic DOM harness.

## Cache and version policy

- Static sources use memory caching only when `cachePolicy: 'memory'` is set.
- Cache identity is `cacheKey` (or URL/source ID) plus the source `version`.
- Generated assets use the configuration `dataVersion`; publishing a new data
  version therefore creates a new parsed cache entry.
- `refresh({ bypassCache: true })` evicts the selected version before retrying.
- Hosts should use immutable HTTP caching for versioned asset URLs and short or
  revalidated caching for unversioned URLs.
- Parsed cache entries last for the JavaScript realm. They contain no DOM or map
  objects and can be released explicitly with `clearDataSourceCache()`.
