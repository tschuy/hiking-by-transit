---
layout: default
title: "Transit-accessible Trailheads - GPKG format"
---

# Transit-accessible Trailheads - GPKG

The following documentation describes the data contained in the latest version of the
Hiking by Transit trailhead dataset, [`transit_accessible_trailheads_20260126.gpkg`](/assets/gpkg/transit_accessible_trailheads_20260126.gpkg).

The dataset is designed for use with the [MTC Regional GTFS feed](https://511.org/open-data/transit). Download the regional feed by specifying `operator_id=RG`: `http://api.511.org/transit/datafeeds?api_key=[your_key]&operator_id=RG`.

## Current status

All **trailheads** served by fixed-route transit on the *Hiking by Transit* map have been added to this package. **Transit information** has only been added for fixed-route transit in the 9-county Bay Area. The following is anticipated in upcoming editions of this package:

* Trailheads and transit information for microtransit and public dial-a-ride (ex: Silicon Valley Hopper, SamCoast)
* Trailheads and transit information for park shuttle services (Muir Woods Shuttle, Emerald Bay Shuttle)
* Transit information for trailheads outside of the 9-county Bay Area 

## Layers

### Trailheads: `trailheads`

Contains trailhead information.

* `geom`: trailhead location

* `trailhead_id`: auto-generated ID for trailhead
* `trailhead_name`: Human-readable name for trailhead. Includes both park and trail/trailhead name.
* `notes`: Human-readable notes about trailhead. Can include information about larger adjacent parks trailhead can be used to access.

### Stop access: `transit_stop_access`

Contains transit stop and access information.

* `geom`: transit stop location

* `access_id`: unique ID for transit stop. If available, initial `stop_id` from time of generation, but this can drift.
* `trailhead_id`: foreign key reference to `trailheads` layer
* `stop_id`: GTFS `stop_id` for transit stop. See below for information on how this is used.
* `stop_name`: Human-readable name of transit stop, taken from GTFS if available
* `walk_time_min`: Estimated walking time to trailhead from transit stop
* `walk_source`: Source of calculation for walk_time_min; current options: `routed` = calculated using machine routing engine (ex: Google Maps, OsmAnd)
* `notes`: Human-readable notes about transit stop to trailhead (ex: walking route conditions, crossing safety)
* `gtfs_source`: URL of GTFS feed used for frequency and stop name information
* `weekday_frequency`: number of times a day transit stop is served on average weekday
* `saturday_frequency`: number of times a day transit stop is served on Saturday
* `sunday_frequency`: number of times a day transit stop is served on Sunday
* `routes_served`: comma-separated string containing transit routes *from GTFS feed* serving transit stop

**GTFS calculations**: to calculate frequency and routes serving a transit stop, all transit stops with an identical name are combined. This allows for scenarios where multiple operators serve a single stop, but the combined MTC GTFS feed does not accurately merge them.

**routes_served**: this field contains specifically route IDs from the GTFS feed: for instance, `SM:14,SM:110,SM:10,SM:19`. Transit routes outside of a GTFS feed (Bear Transit, Amtrak, etc) are exclusively noted in the `notes` field, as the `routes_served` field is designed to be used programmatically.
