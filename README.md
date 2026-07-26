# Hiking by Transit application

## TL;DR

Requires Node.js 22.22.0 (`.node-version`). The normal development and deploy
workflow is:

```sh
npm ci                 # install the locked dependencies
npm run dev            # start the local Vite development server
npm run build          # create the deployable, prerendered site in dist/
npm run verify         # run generated-data checks, lint, tests, builds, and E2E tests
npm run deploy         # build and deploy the hiking-by-transit Worker
```

`npm run build` is intentionally Node-only and does not rewrite committed data.
After changing the authoritative GeoPackage, canonical KML, or normalized
content, run `python3 -m pip install -r requirements-generation.txt` once, then
run `npm run generate`, review and commit its generated catalog/KML changes,
and use `npm run check:generated` for a non-mutating freshness check. These
Python geospatial dependencies are not installed during a Cloudflare build.

React, TypeScript, and Vite application for the Hiking by Transit site. The
canonical framework-independent map package lives in `packages/olmap` and is
linked through the repository's npm workspace.

## Development

```sh
npm install
npm run dev
```

Use `npm run lint` for ESLint and `npm run test` for unit tests. The map package
has its own full verification command:

```sh
npm --workspace olmap run verify
```

## Static rendering and Cloudflare Workers deployment

The production build prerenders every route in the content catalogs. React
hydrates that HTML in the browser for maps, search, slideshows, and other
interaction; page content and navigation remain available without JavaScript.

- `npm run build:client` builds the browser application.
- `npm run build:olmap` builds the local map workspace consumed by the app.
- `npm run build:ssr` builds the temporary server-rendering entry.
- `npm run prerender` writes route-specific HTML into `dist`.
- `npm run check:prerender` verifies content, metadata, and hydration assets.
- `npm run prepare:cloudflare` splits assets that exceed Cloudflare's per-file
  upload limit. It modifies only the ignored `dist` build output.
- `npm run build` runs the complete deployable production-build sequence.
- `npm run deploy` builds and promotes a production Worker deployment.
- `npm run deploy:preview` builds and uploads a non-production Worker version.

The Worker is configured in `wrangler.jsonc` as `hiking-by-transit`. Cloudflare
serves generated route files with automatic trailing-slash handling and uses
the prerendered `404.html` for unknown paths instead of falling back to
home-page markup.

For deployment on push, connect the GitHub repository to the
`hiking-by-transit` Worker under **Settings → Builds** and use:

```text
Production branch: main
Build command: npm run build
Deploy command: npx wrangler deploy
Non-production deploy command: npx wrangler versions upload
```

Cloudflare installs the locked npm dependencies before the build. The Worker
name in Cloudflare must exactly match the name in `wrangler.jsonc`. The GitHub
Actions workflow verifies changes but does not deploy them.

## Generated data

The authoritative trailhead data lives in
`data/transit_accessible_trailheads.gpkg`; special-service KML sources live in
`data/kml`. `npm run generate` validates those inputs, regenerates
`src/data/catalog-v0.9.generated.json`, and copies the canonical KML into the
public asset tree. Generated files are committed so Cloudflare builds remain
fast, reproducible, and independent of a Python geospatial environment.

## Map integration

`src/hooks/useTrailheadMap.ts` is the lifecycle adapter. It dynamically imports
the `olmap` ESM entry only on pages with a map, fetches and validates the map
configuration, creates the controller after the target ref mounts, and destroys
it during effect cleanup. React owns filters, details, result pagination,
loading, partial errors, and retries; OpenLayers objects never enter React
state.

Map URL state uses validated query parameters:

- `x`, `y`, and `z` for the projected center and zoom;
- repeated `layer` values for enabled trailhead/transit/boundary layers;
- `selected` for the selected feature ID;
- `view=map|list` for the active accessible view.

The same `TrailheadMap` component supports the statewide page and scoped place
maps. Data asset URLs are assembled at the application boundary in
`src/map/sources.ts`; the core package has no application asset-root knowledge.

Hike and post GPX embeds also use `olmap`. `src/map/gpx.ts` parses each GPX once
into shared route geometry and distance/elevation samples. `GpxMap` sends the
geometry to the map controller and renders the samples with the accessible
React/SVG `ElevationProfile`; pointer or keyboard inspection updates a common
route-position marker. No Leaflet scripts, plugins, or styles are injected.
