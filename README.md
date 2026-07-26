# Hiking by Transit application

React, TypeScript, and Vite application for the Hiking by Transit site. The
canonical framework-independent map package lives in `packages/olmap` and is
linked through the repository's npm workspace.

## Development

```sh
npm install
npm run dev
```

Use `npm run build` for application type checking, client and server builds,
static route generation, and prerender verification. Use `npm run lint` for
ESLint. The map package has its own full verification command:

```sh
npm --workspace olmap run verify
```

## Static rendering and deployment

The production build prerenders every route in the content catalogs. React
hydrates that HTML in the browser for maps, search, slideshows, and other
interaction; page content and navigation remain available without JavaScript.

- `npm run build:client` builds the browser application.
- `npm run build:ssr` builds the temporary server-rendering entry.
- `npm run prerender` writes route-specific HTML into `dist`.
- `npm run check:prerender` verifies content, metadata, and hydration assets.
- `npm run build` runs the complete sequence.
- `npm run deploy:dev` builds, prepares large Cloudflare assets, and deploys.

Cloudflare serves generated route files with automatic trailing-slash handling
and uses the prerendered `404.html` for unknown paths instead of falling back to
home-page markup.

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
