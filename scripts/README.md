# README

This directory contains scripts used to manage the *Hiking by Transit* database.

Currently, the canonical source of information for trailheads and transit information for fixed-route transit is `data/transit_accessible_trailheads.gpkg`. For shuttles, microtransit, and call-ahead services, static bespoke KML files are used.

## KML Processor: `gpkg_to_kml.py`

Generates KMLs for fixed-route transit from the canonical GPKG.

`python gpkg_to_kml.py ../data/transit_accessible_trailheads.gpkg`
