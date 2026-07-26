# README

This directory contains scripts used to manage the *Hiking by Transit* database.

Currently, the canonical source of information for trailheads and transit information for fixed-route transit is `data/transit_accessible_trailheads.gpkg`. For shuttles, microtransit, and call-ahead services, static bespoke KML files are used.

Trailhead IDs are generally, but not always `f"TH_{abs(hash(TRAILHEAD_NAME)) % 10_000_000}"`.

## KML Processor: `gpkg_to_kml.py`

Generates KMLs for fixed-route transit from the canonical GPKG.

`python gpkg_to_kml.py ../data/transit_accessible_trailheads.gpkg`

## Adding a new stop: `stop_summary.py`

Once you've determined the `stop_id` of a stop to add to the `transit_stop_access` layer, you can fetch all of the necessary data about it with `stop_summary.py`.

This script combines stops with the same name as often there are duplicative stops in the GTFS, only some of which are still used. This does have the side effect of double counting in locations where stops in either direction share the smae name. 

```
$ cat gtfs/bayarea/stops.txt | grep 70041
70041,South San Francisco Caltrain Station Northbound,70041,,37.65594,-122.40498,CT:79011,,,,0,south_sf,America/Los_Angeles,2,
$ python stop_summary.py ./gtfs/bayarea.zip 70041
Stop Name: South San Francisco Caltrain Station Northbound (Stop IDs: 70041)
Coordinates: lon=-122.40498, lat=37.65594

Average number of stops per day:
  Weekdays: 52.0
  Saturday: 33.0
  Sunday:   33.0

Routes serving this stop:
['CT:Local Weekday', 'CT:Local Weekend', 'CT:Express', 'CT:Limited']

 Stop lon,lat:
-122.40498,37.65594
```

## Fetching GTFS: `download_gtfs.py`

Downloads GTFS feeds defined in `constants.py`. Requires an API key from MTC.

`$ python download_gtfs.py --mtc-api-key xx-xx-xx-xx-xx`

## Trailhead statistics: `trailhead_service_levels.py`

Calculates basic service level information:

```
$ python trailhead_service_levels.py

Summary:
  Stops served: 233
  Total weekly services: 45917
  Average per stop: 197
```

## Converting GTFS to KML: `gtfs_to_kml.py`

It's often very useful to have transit stops in KML, a more widely-supported format
for use with various mapping software (ex: CalTopo, mobile apps, etc).

This script extracts stops and put them in a KML file with their stop_id.

`gtfs_to_kml.py --gtfs ./gtfs/weaverville-ca-us.zip --output weaverville.kml`

## Full build

1) Rebuilding the olmap

```
$ cd olmap/
$ npm run build-and-deploy
```

2) Rebuilding KML

```
$ cd scripts/
$ python gpkg_to_kml.py ../data/transit_accessible_trailheads.gpkg
$ cp ../data/*.kml ../assets/kml/
```

## Building route layers

1) Build the layers: this command outputs the resultant layers to `geojson/`.

`$ gtfs-to-geojson`

2) Clip Amtrak:

```
$ ogr2ogr -f GeoJSON geojson/amtrak-clipped.geojson geojson/amtrak.geojson -clipsrc california_and_reno.geojson -lco RFC7946=YES -lco COORDINATE_PRECISION=6
```