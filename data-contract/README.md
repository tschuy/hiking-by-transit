# Hiking by Transit Data Schema and Catalog Contract

## Status

The application publishes the current GeoPackage plus three hand-maintained KML sources through the transitional v0.9 static catalog contract. The richer source schema and v1 contract remain the documented future target. Migration and generation scripts validate source data before publishing artifacts.

Machine-readable contracts:

- [`catalog-v0.9.schema.json`](./catalog-v0.9.schema.json) — current transitional catalog reflecting the existing GeoPackage fields.
- [`catalog-v1.schema.json`](./catalog-v1.schema.json) — deferred catalog after the source-schema milestone.
- [`hike-frontmatter-v1.schema.json`](./hike-frontmatter-v1.schema.json) — target Markdown frontmatter.

## Current v0.9 decision

Version 0.9 deliberately does not require `feed_id`, renamed arrival columns, trailhead slugs, statuses, verification dates, accessibility fields, or `trailhead_places`. It exports the two current spatial layers without mutating their schema.

- Existing `*_frequency` source values are exposed under a `frequency` object and documented as representative-day arrival counts.
- Existing comma-separated `routes_served` values are split into `routeIds` arrays during export.
- `sourceFid` distinguishes the current duplicated `access_id` without treating the GeoPackage row ID as permanent identity.
- Missing stop IDs, walk times, routes, and notes remain nullable where the source is incomplete.
- Reverse hike and place relationships can be derived from normalized Markdown rather than being written into the GeoPackage yet.

## Inspected sources

Authoritative sources:

- `data/transit_accessible_trailheads.gpkg`
- `data/kml/shuttles.kml`
- `data/kml/microtransit.kml`
- `data/kml/call-ahead.kml`
- `content/hikes/*.md`

Observed GeoPackage structure on 2026-07-25:

| Layer | Geometry | CRS | Rows | Purpose |
|---|---|---:|---:|---|
| `trailheads` | Point | EPSG:4326 | 577 | One canonical point per trailhead |
| `transit_stop_access` | Point | EPSG:4326 | 614 | A transit stop that provides access to a trailhead |

The three canonical KML files contain another 45 hand-maintained trailheads for
services that are not generated from the GeoPackage. Catalog generation copies
those exact sources to `public/assets/kml/` and gives their placemarks stable
KML-scoped IDs and detail-page slugs.

Current `trailheads` columns:

| Column | Current meaning |
|---|---|
| `fid` | GeoPackage feature row ID; not a public ID |
| `geom` | Trailhead point |
| `trailhead_id` | Stable public identifier such as `TH_2240612` |
| `trailhead_name` | Display name |
| `notes` | Free-form source notes |

Current `transit_stop_access` columns:

| Column | Current meaning |
|---|---|
| `fid` | GeoPackage feature row ID; not a public ID |
| `geom` | Transit-stop point |
| `access_id` | Intended stable access-record ID |
| `trailhead_id` | Foreign key to `trailheads.trailhead_id` |
| `stop_id` | Stop ID from the referenced GTFS feed |
| `stop_name` | Snapshot of the GTFS stop name |
| `walk_time_min` | Routed walking time in minutes |
| `walk_source` | Currently always `routed` |
| `notes` | Free-form access and safety notes |
| `gtfs_source` | GTFS source URL |
| `weekday_frequency` | Average arrivals per representative weekday |
| `saturday_frequency` | Arrivals on a representative Saturday |
| `sunday_frequency` | Arrivals on a representative Sunday |
| `routes_served` | Comma-separated GTFS route IDs |

Current integrity findings:

- All 577 trailheads have unique, non-empty `trailhead_id` values.
- Every access record refers to an existing trailhead.
- One `access_id` is duplicated: `ACC_TH_9353285_SS:334823`.
- Two access records have no `stop_id`.
- Sixteen access records have no `walk_time_min`.
- Four access records have no `routes_served` value.
- Frequency values are counts of arrivals, not minutes between vehicles.
- A frequency value of `0` means no scheduled service for that day type in the representative schedule.
- `stop_id` is only unique within a GTFS feed and must be qualified by a stable feed ID.
- The current trailhead-ID generator uses Python's runtime-dependent `hash()` and must not be used for new permanent IDs.

Current Markdown observations:

- The directory mixes full hike guides (`layout: hike`) and destination overview posts (`layout: post`).
- Existing hike files do not contain stable `hike_id`, `trailhead_ids`, or `place_ids` fields.
- Frontmatter includes useful editorial fields such as `travel`, `difficulty`, `length`, `gpx`, `image`, `blurb`, and `getting-there`.
- Similar fields are inconsistent in places: `stop` versus `stops`, `trailhead` versus `trailhead-link`, and `link` versus `linK`.
- Transit itinerary content in Markdown is editorial and may intentionally differ from the nearest access record. It should not be overwritten from the GeoPackage.

## Ownership boundaries

| Data | Authoritative source |
|---|---|
| Trailhead identity, name, point, and source notes | GeoPackage `trailheads` |
| Stop identity, point, walking connection, and computed service snapshot | GeoPackage `transit_stop_access` |
| Shuttle, microtransit, and call-ahead trailheads and service notes | Canonical `data/kml/*.kml` files |
| Hike identity, prose, difficulty, media, GPX reference, and recommended itinerary | Hike Markdown |
| Hike-to-trailhead relationship | Markdown `trailhead_ids` |
| Hike-to-place relationship | Markdown `place_ids` |
| Trailhead-to-place relationship | GeoPackage `trailhead_places` attribute table |
| Place names, hierarchy, descriptions, and media | Future place content files |
| Search documents and map/list catalog | Generated build artifacts only |

Generated JSON must never become a separately edited source of truth.

## Target GeoPackage schema

Keep the two existing spatial layers. Add fields and non-spatial attribute tables incrementally so existing QGIS and generation workflows continue to work.

### `trailheads` feature table

| Column | Type | Null | Requirement |
|---|---|---:|---|
| `fid` | INTEGER | No | GeoPackage primary key; never exposed as identity |
| `geom` | POINT, EPSG:4326 | No | Longitude/latitude trailhead point |
| `trailhead_id` | TEXT | No | Permanent ID matching `^TH_[0-9]+$`; unique and immutable |
| `slug` | TEXT | No | Stable URL slug; unique; must not change automatically when the name changes |
| `trailhead_name` | TEXT | No | Human-readable name |
| `notes` | TEXT | Yes | Internal/source notes; not assumed safe for direct HTML rendering |
| `official_url` | TEXT | Yes | Authoritative land-manager or trailhead URL |
| `accessibility_notes` | TEXT | Yes | Public accessibility information |
| `status` | TEXT | No | `active`, `seasonal`, `temporarily_closed`, `retired`, or `research` |
| `last_verified_date` | TEXT | Yes | ISO 8601 calendar date, `YYYY-MM-DD` |

Migration defaults:

- Existing `trailhead_id` values are retained unchanged.
- Generate and review initial slugs once; thereafter treat them as permanent identifiers.
- Existing records default to `status = 'active'` unless reviewed otherwise.

### `transit_stop_access` feature table

| Column | Type | Null | Requirement |
|---|---|---:|---|
| `fid` | INTEGER | No | GeoPackage primary key |
| `geom` | POINT, EPSG:4326 | No | Snapshot of the transit-stop point |
| `access_id` | TEXT | No | Permanent unique access-record ID |
| `trailhead_id` | TEXT | No | Foreign key to `trailheads.trailhead_id` |
| `feed_id` | TEXT | No | Stable ID from transit configuration, independent of feed URL |
| `stop_id` | TEXT | Yes | Stop ID within `feed_id`; null only for non-GTFS/manual service |
| `stop_name` | TEXT | No | Public stop name snapshot |
| `walk_time_min` | REAL | Yes | Non-negative routed or estimated minutes |
| `walk_source` | TEXT | No | `routed`, `estimated`, `measured`, or `unknown` |
| `notes` | TEXT | Yes | Public access/safety notes |
| `gtfs_source` | TEXT | Yes | Source URL snapshot for provenance, not identity |
| `service_as_of_date` | TEXT | Yes | Date or representative schedule start date used for counts |
| `weekday_arrivals` | REAL | Yes | Average arrivals per representative weekday |
| `saturday_arrivals` | REAL | Yes | Arrivals per representative Saturday |
| `sunday_arrivals` | REAL | Yes | Arrivals per representative Sunday |
| `routes_served` | TEXT | Yes | Transitional comma-separated route IDs; exported as an array |
| `reservation_required` | INTEGER | No | Boolean `0` or `1` |
| `seasonal` | INTEGER | No | Boolean `0` or `1` |
| `last_verified_date` | TEXT | Yes | ISO 8601 calendar date |

The existing `*_frequency` columns should be renamed or migrated to `*_arrivals`. Until migration, the exporter maps them without changing their numeric values. `null` means unknown; `0` means known to have no scheduled arrivals.

Access identity must use `(feed_id, stop_id, trailhead_id)` rather than a mutable URL. Manual services without a GTFS stop should receive a documented manual stop key. The duplicate access record must be resolved before uniqueness is enforced.

### `trailhead_places` attribute table

This is a non-spatial GeoPackage attributes table.

| Column | Type | Null | Requirement |
|---|---|---:|---|
| `trailhead_id` | TEXT | No | Foreign key to `trailheads.trailhead_id` |
| `place_id` | TEXT | No | Stable place ID from place content |
| `relationship` | TEXT | No | `within`, `accesses`, or `near` |
| `is_primary` | INTEGER | No | Boolean; at most one primary place per relationship type |

Primary key: `(trailhead_id, place_id, relationship)`.

This normalized table avoids storing comma-separated place IDs in a spatial feature field and allows one trailhead to belong to nested or overlapping places.

### Optional `data_releases` attribute table

| Column | Type | Requirement |
|---|---|---|
| `release_id` | TEXT | Unique build/source release ID |
| `created_at` | TEXT | ISO 8601 timestamp |
| `description` | TEXT | Human-readable source revision note |
| `git_revision` | TEXT | Git commit when known |

The catalog generator may instead derive release metadata in CI, but it must always publish equivalent provenance in the manifest.

## Required GeoPackage constraints

The validation pipeline must enforce:

1. `trailheads.trailhead_id` is present and unique.
2. `trailheads.slug` is present, unique, lowercase, and URL-safe.
3. Every trailhead has a valid point within expected California coverage bounds.
4. `transit_stop_access.access_id` is present and unique.
5. Every access record references an existing trailhead.
6. Every GTFS access record has both `feed_id` and `stop_id`.
7. `(trailhead_id, feed_id, stop_id)` is unique when `stop_id` is present.
8. Walking minutes and arrival counts are non-negative when known.
9. Route IDs are trimmed and non-empty after splitting.
10. Every `trailhead_places.place_id` exists in place content.
11. Dates use ISO 8601 calendar-date syntax.
12. Public strings are treated as text, not trusted HTML.

## Target hike Markdown frontmatter

Existing files can be migrated gradually. New and migrated full hike guides should include:

```yaml
---
layout: hike
hike_id: hike-siesta-valley
slug: siesta-valley
title: "Siesta Valley & Claremont Canyon: Orinda to Berkeley"
trailhead_ids:
  - TH_2240612
place_ids:
  - bay-area
  - east-bay
difficulty: moderate
difficulty_human: moderate to hard
length: 6.1mi
tags:
  - forest
  - hills
gpx: siesta-valley.gpx
image: siesta-valley.jpg
featured: false
travel:
  origin: Rockridge BART
  served: daily
  out:
    time: 5min
    routes:
      - name: BART Yellow line
        link: https://bart.gov/schedules
    stops:
      - name: Orinda BART
        link: https://example.com/
---
```

Rules:

- `hike_id` is permanent and must not be derived again after creation.
- `slug` is the canonical URL segment and remains stable across title changes.
- `trailhead_ids` contains one or more GeoPackage IDs. Order follows the hike direction; the first is the start and the last is the end for a through-hike.
- `place_ids` may contain nested places and must include the most specific useful place.
- `travel` remains editorial. It is not required to match the nearest stop in `transit_stop_access`.
- Normalize `stop` and `stops` to `stops` arrays during migration.
- Normalize `difficulty-human` to `difficulty_human`.
- Normalize misspelled `linK` keys to `link`.
- Destination overview posts should move to the future place-content schema rather than receiving fake hike or trailhead IDs.

## Generated catalog layout

Version 1 may be published as a single catalog because the current combined 622-trailhead dataset is modest:

```text
public/data/catalog-v1.json
```

If later partitioned, preserve identical trailhead, hike, and place object shapes:

```text
public/data/catalog-v1/manifest.json
public/data/catalog-v1/trailheads-00.json
public/data/catalog-v1/trailheads-01.json
public/data/catalog-v1/hikes.json
public/data/catalog-v1/places.json
```

Do not create one static file per trailhead unless deployment file-count limits have been reviewed.

## Catalog field semantics

The root catalog contains:

- `schemaVersion` — contract version; consumers must reject unsupported major versions.
- `generatedAt` — build timestamp.
- `source` — source file identity, checksums/revisions, and service snapshot dates.
- `counts` — integrity-friendly entity counts.
- `trailheads` — normalized GeoPackage trailheads with nested access records plus canonical hand-maintained KML trailheads.
- `hikes` — normalized Markdown metadata, not full rendered article HTML.
- `places` — place identities and hierarchy.

Coordinates are always GeoJSON order `[longitude, latitude]` in WGS84.

Unknown and zero are distinct:

- `null` means unknown, unavailable, or not yet measured.
- `0` is a known numeric zero, including no scheduled service.
- Missing optional properties should be avoided in generated entities; emit `null` where the schema allows it.

Routes are exported as arrays. The build currently splits `routes_served` on commas and trims each ID. Future source normalization may replace that transitional field without changing the JSON contract.

## Identifier rules

- Existing `TH_*` values remain canonical trailhead IDs.
- New trailhead IDs must be generated with a deterministic collision-safe process, preferably UUIDv7 or a centrally allocated numeric sequence formatted to retain the existing `TH_` namespace.
- Never use Python `hash()` for permanent IDs.
- `access_id` is opaque to clients even if generated from component IDs.
- `feed_id` comes from version-controlled transit configuration, not the GTFS URL.
- A globally meaningful stop key is `${feed_id}:${stop_id}`.
- Hike and place IDs are lowercase stable strings with explicit namespaces or documented slug rules.
- Slugs are routing identifiers; IDs are relationship identifiers. They may initially match but must not be treated as interchangeable.

## Build output and validation sequence

1. Open the GeoPackage read-only and parse the three canonical KML sources.
2. Validate its schema and all required constraints.
3. Resolve the current duplicate access record before publishing strict version 1 output.
4. Load place content and build the valid place-ID set.
5. Parse hike Markdown and validate target frontmatter.
6. Verify every hike `trailhead_id`, `place_id`, GPX file, and image reference.
7. Join `trailhead_places` and hike relationships onto trailhead records.
8. Convert geometries to WGS84 `[longitude, latitude]` arrays.
9. Convert frequency snapshots to explicitly named arrival counts.
10. Split route strings into arrays and derive filter facets.
11. Sort all arrays deterministically by ID.
12. Validate the generated object against `catalog-v1.schema.json`.
13. Write JSON atomically with a source checksum and build timestamp.
14. Copy canonical KML sources to `public/assets/kml/` and generate search and map artifacts from the same validated inputs.

## Contract evolution

- Version the catalog using semantic major/minor syntax such as `1.0`.
- Additive optional fields may increment the minor version.
- Removed fields, renamed fields, changed units, and changed null semantics require a new major version.
- Generators should support one explicit schema version at a time.
- Consumers should fail visibly on unsupported major versions rather than guessing.
- Source-schema migrations and catalog-contract versions are related but independently versioned.
