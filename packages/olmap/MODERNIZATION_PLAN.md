# `olmap` Modernization Plan

## Goal

Turn the imported legacy map into the canonical, framework-independent `olmap`
package, then integrate it into `my-app` through a thin React adapter. Preserve
the current trailhead, transit, protected-area, GPX, popup, and filtering
behavior throughout the migration.

This plan implements the direction in
[`../../olmap-roadmap.md`](../../olmap-roadmap.md). The files imported alongside
this plan are the unchanged baseline from `hbt`; modernization starts in later
commits so the source and each behavioral change remain easy to compare.

## Working principles

- Keep the core independent of React and application markup.
- Replace globals and fixed document IDs with explicit inputs.
- Make lifecycle, state, events, errors, and data loading observable and typed.
- Preserve a compatibility entry point until the React integration reaches
  feature parity.
- Keep each milestone independently buildable and reviewable.
- Treat accessibility, cleanup, partial failure, and performance as acceptance
  criteria rather than final polish.

## Phase 0 — Record and stabilize the baseline (complete)

Before restructuring, make the current behavior reproducible.

### Work

- Document the current runtime contract: required DOM nodes, global variables,
  asset paths, data shapes, default visibility, view defaults, and external tile
  services.
- Add a package `typecheck` command and establish whether the imported source
  builds without modification; record any baseline failures separately from
  modernization regressions.
- Add fixture configuration plus small GeoJSON, KML, and GPX files that exercise
  every current layer and popup path.
- Add config and asset-integrity checks for feed groups, routes, layer names, and
  referenced static files.
- Capture a manual parity checklist for pointer interaction, mobile panning,
  filters, popup links, protected-area attribution, and scoped place maps.
- Remove or gate debug logging and add version identifiers to the library and
  generated data.

### Exit criteria

- The legacy entry point can be built and exercised against fixtures.
- Current contracts and known baseline defects are documented.
- CI can distinguish missing/bad data from application-code failures.

## Phase 1 — Establish package boundaries and typed contracts (complete)

Create a stable public surface before moving behavior.

### Proposed structure

```text
packages/olmap/
  src/
    core/
      createTrailheadMap.ts
      controller.ts
      events.ts
      state.ts
    config/
      schema.ts
      validate.ts
    data/
      loaders.ts
      normalize.ts
      sources.ts
    layers/
    presentation/
    legacy/
      bootstrap.ts
    index.ts
  styles/
    openlayers.css
    default.css
  test/
```

### Work

- Move authored code under `src` without changing behavior and expose explicit
  package exports for the controller, types, legacy adapter, and optional CSS.
- Define versioned, serializable types for configuration, data sources, hikes,
  filters, view state, feature summaries, layer progress, and typed errors.
- Correct the current snake-case/camel-case contract mismatch and validate
  unknown JSON at runtime before layer construction.
- Define `TrailheadMapOptions`, `TrailheadMapController`, and a discriminated
  `TrailheadMapEvent` union.
- Keep OpenLayers an explicit package dependency and ensure generated TypeScript
  declarations and source maps are part of the package build.

### Exit criteria

- Consumers can import all public types without importing React or starting a
  map.
- Invalid configuration produces actionable errors containing the source and
  field path.
- The package builds as ESM with declarations and no top-level application side
  effects.

## Phase 2 — Extract the controller and lifecycle (complete)

Move map creation out of top-level module execution.

### Work

- Implement `createTrailheadMap(options)` with an `HTMLElement` target, injected
  config/data sources, tile source, hikes, initial view, initial filters, and
  event callback.
- Return a controller with `ready`, `getState`, `setView`, `fitToExtent`,
  `setFilters`, `selectFeature`, `clearSelection`, `setHikes`, `setDataSources`,
  `refresh`, `updateSize`, and `destroy`.
- Track every OpenLayers key, DOM listener, observer, timer, overlay, source, and
  pending request in one lifecycle owner.
- Make `destroy()` idempotent, abort pending fetches, detach the map target, and
  clear retained references.
- Remove `document.getElementById`, `location`, `localStorage`, and
  `hikes_with_gpx` access from the core. Pass any optional environment-derived
  value through an adapter.
- Preserve current behavior through `legacy/bootstrap.ts`, which translates the
  old DOM/global contract into controller options.

### Exit criteria

- Two maps can coexist with independent state.
- Mount/destroy/remount works under React Strict Mode without duplicate
  listeners, requests, overlays, or retained map targets.
- The legacy page remains behaviorally equivalent through its adapter.

## Phase 3 — Separate state, UI, and feature presentation (complete)

Make React and other hosts owners of application UI.

### Work

- Keep serializable state in the controller and emit `ready`, `loading-change`,
  `error`, `view-change`, `move-end`, `filters-change`,
  `visible-features-change`, `feature-hover`, `feature-select`,
  `selection-clear`, and `layer-visibility-change` events.
- Extract filter evaluation into pure functions; apply layer and feature changes
  atomically before emitting the new state.
- Normalize trailhead, stop, route, hike, protected-area, action, and cluster
  details into plain objects with stable IDs.
- Replace popup `innerHTML` and link mutation with structured selection events.
  Keep an optional, sanitized DOM popup renderer only for the legacy adapter.
- Emit debounced visible trailhead IDs after `moveend`, with deterministic
  ordering, total count, a configurable result limit, and selected-item
  retention.
- Scope default styles beneath an `olmap` root class, split OpenLayers base CSS
  from optional theme CSS, and remove global element and fixed-ID selectors.
- Define focus restoration, keyboard labels, reduced-motion behavior, and
  accessible error/loading hooks for adapters.

### Exit criteria

- Filters and viewport queries are unit-testable without constructing a map.
- Host UI can render hover, popup, loading, errors, counts, and layer controls
  without the core querying or changing host markup.
- State and event payloads contain no OpenLayers objects.

## Phase 4 — Modernize data loading and configuration (complete)

Remove deployment assumptions from the core and make failures recoverable.

### Work

- Replace `/assets/...` constants with injected URLs or loader functions under a
  common data-source interface.
- Add `AbortSignal` support, per-source loading progress, retryability, cache
  keys, schema/data versions, attribution, freshness metadata, and partial-error
  reporting.
- Load optional transit networks only when visible and abort obsolete loads.
- Normalize source properties once at the loading boundary rather than in popup
  and hover code.
- Make absent/unavailable feeds explicit, and allow healthy layers to remain
  usable after another layer fails.
- Inject tile URLs and attribution. Remove the committed provider credential and
  use a credential-free development default; document the production proxy or
  restricted-token requirement.
- Validate generated JSON and referenced GeoJSON/KML/GPX assets in CI.

### Exit criteria

- The same core runs against fixtures, static assets, or custom loaders.
- A failed or canceled layer does not prevent other layers from becoming ready.
- No credential or deployment-specific asset root is embedded in package output.

## Phase 5 — Add clustering and statewide performance controls (complete)

Optimize only after the controller and data boundaries are measurable.

### Work

- Add configurable clustering by layer, distance, and zoom; expose cluster size
  and member IDs and define predictable activation/expansion behavior.
- Use source spatial indexes for extent queries and measure whether parsing or
  indexing warrants a Web Worker.
- Establish budgets for package JavaScript, initial trailhead data, first usable
  map, `moveend`-to-list latency, long tasks, and memory after repeated route
  transitions.
- Profile the full statewide dataset before choosing partitioned GeoJSON or
  vector tiles; adopt either only when measurements justify it.
- Add cache/version policy and performance regression fixtures.

### Exit criteria

- Statewide results do not require a statewide DOM list.
- Cluster and visible-result behavior is deterministic and covered by tests.
- Measured budgets are documented and enforced in CI where practical.

## Phase 6 — Replace the React script adapter (complete)

Integrate the package normally once its controller is stable.

### Work

- Add `useTrailheadMap` inside `my-app`; initialize from a target ref in an
  effect and destroy in cleanup.
- Replace dynamic script/stylesheet injection and `window.hikes_with_gpx` in
  `TrailheadMap.tsx` with ESM imports and typed options.
- Keep callbacks stable, update filters/data through controller commands, and do
  not store OpenLayers objects in React state.
- Synchronize center, zoom, filters, selection, and map/list mode with validated
  URL parameters.
- Connect markers and clusters bidirectionally with the paginated or virtualized
  semantic companion list, including an ARIA live result count and a skip-map
  link.
- Let React render normalized popup content and accessible loading, empty,
  partial-error, and retry states.
- Reuse the same adapter for statewide and place-scoped maps through supplied
  bounds and filters.

### Exit criteria

- `my-app` imports `olmap` as ESM and has no map globals, fixed-ID contract, or
  persistent injected assets.
- URL state round-trips and marker/list selection works in both directions.
- The adapter survives Strict Mode and route transitions without leaks.

## Phase 7 — Verify parity and retire compatibility paths

### Work

- Add unit tests for validation, normalization, filters, state transitions,
  popup actions, extent ordering, and sanitization.
- Add integration tests for initialization, cleanup, multiple instances,
  partial failures, emitted events, selection, and restored state.
- Add browser coverage for keyboard/pointer operation, popup focus, clusters,
  two-finger mobile panning, route transitions, and repeated mount cycles.
- Verify accessibility and responsive behavior at 375px, 768px, and 1440px,
  plus 200% and 400% browser zoom.
- Run package type checking/tests and application type checking, lint, tests,
  and production build in CI.
- Keep the legacy adapter published until the old Jekyll consumer is formally
  retired; remove only the precompiled-copy deployment path after both consumers
  have documented migration instructions.

### Exit criteria

- The definition of done in `olmap-roadmap.md` is satisfied.
- The React adapter has feature parity and browser coverage.
- Compatibility code has an explicit owner and retirement decision rather than
  being removed implicitly during refactoring.

## Recommended implementation order

Start with Phase 0 and keep each phase as a series of narrow commits. The first
vertical slice should initialize one fixture trailhead layer through the new
controller, emit ready/view/selection events, and cleanly destroy; then migrate
the remaining current layers behind the same contracts. This exercises the
highest-risk lifecycle and API design early while the legacy adapter preserves
the current site.
