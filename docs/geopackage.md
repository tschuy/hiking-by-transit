---
layout: default
title: "Transit-accessible Trailheads - GPKG format"
---

# Transit-accessible Trailheads - GPKG

The following documentation describes the data contained in the latest version of the
Hiking by Transit trailhead dataset, [`transit_accessible_trailheads_20260127.gpkg`](/assets/gpkg/transit_accessible_trailheads_20260127.gpkg).

For *Hiking by Transit*, trailheads are generally considered "transit accessible" if there is a bus stop within a 30-minute walk (1.5mi, on flat terrain) of the trailhead itself. For certain trails, generally trails intended for longer-distance hiking, longer distances are allowed.

The dataset is designed for use with the [MTC Regional GTFS feed](https://511.org/open-data/transit). Download the regional feed by specifying `operator_id=RG`: `http://api.511.org/transit/datafeeds?api_key=[your_key]&operator_id=RG`.

## Current status

All **trailheads** and **transit information** for trailheads served by fixed-route transit on the *Hiking by Transit* map have been added to this package. The following is anticipated in upcoming editions of this package:

* Trailheads and transit information for microtransit and public dial-a-ride (ex: Silicon Valley Hopper, SamCoast)
* Trailheads and transit information for park shuttle services (Muir Woods Shuttle, Emerald Bay Shuttle)

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

* `access_id`: unique ID for transit stop. Formed from `trailhead_id` and `stop_id` or, if not a GTFS-enabled access, other stop-related string
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

**routes_served**: this field contains specifically route IDs from the GTFS feed: for instance, `SM:14,SM:110,SM:10,SM:19`. All `routes_served` are from the GTFS feed in the `gtfs_source` field; if a stop exists across multiple different feeds, that is represented via multiple `transit_stop_access` objects.