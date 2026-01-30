# ---- paths ----
OLMAP_DIR := olmap
SCRIPTS_DIR := scripts
DATA_DIR := data
ASSETS_DIR := assets

KML_DIR := $(ASSETS_DIR)/kml
GEOJSON_DIR := $(ASSETS_DIR)/geojson

VENV := $(SCRIPTS_DIR)/venv
PYTHON := $(VENV)/bin/python

GTFS_TO_GEOJSON := $(OLMAP_DIR)/node_modules/gtfs-to-geojson/dist/bin/gtfs-to-geojson.js

# ---- inputs ----
GPKG := $(DATA_DIR)/transit_accessible_trailheads.gpkg
DATA_KMLS := $(wildcard $(DATA_DIR)/*.kml)

# ---- outputs to watch
OLMAP_JS := public/js/olmap.js
KML_SENTINEL := $(KML_DIR)/.kml_built
GEOJSON_LARGE_SENTINEL := $(GEOJSON_DIR)/.geojson_large_built
GEOJSON_SMALL_SENTINEL := $(GEOJSON_DIR)/.geojson_small_built

# ---- default ----
.PHONY: all
all: olmap kml geojson-large geojson-small

# ---- step 1: olmap build ----
.PHONY: olmap
olmap: $(OLMAP_JS)

$(OLMAP_JS):
	cd $(OLMAP_DIR) && npm run build-and-deploy

# ---- step 2 + 3: kml generation and copy ----
.PHONY: kml
kml: $(KML_SENTINEL)

$(KML_SENTINEL): $(GPKG) $(DATA_KMLS)
	mkdir -p $(KML_DIR)
	cd $(SCRIPTS_DIR) && \
		$(PYTHON) gpkg_to_kml.py ../$(GPKG)
	cp $(DATA_DIR)/*.kml $(KML_DIR)/
	touch $@

## geojson
.PHONY: geojson
geojson: geojson-large geojson-small

# large
.PHONY: geojson-large
geojson-large: $(GEOJSON_LARGE_SENTINEL)

$(GEOJSON_LARGE_SENTINEL):
	mkdir -p $(GEOJSON_DIR)
	cd $(SCRIPTS_DIR) && \
		node ../$(GTFS_TO_GEOJSON) --configPath geojson-large.json
	touch $@

## small
.PHONY: geojson-small
geojson-small: $(GEOJSON_SMALL_SENTINEL)

$(GEOJSON_SMALL_SENTINEL):
	mkdir -p $(GEOJSON_DIR)
	cd $(SCRIPTS_DIR) && \
		node ../$(GTFS_TO_GEOJSON) --configPath geojson-small.json
	touch $@

# cleanup
.PHONY: clean
clean:
	rm -f $(OLMAP_JS)
	rm -rf $(KML_DIR)
	rm -rf $(GEOJSON_DIR)

# development server
.PHONY: serve
serve:
	bundle exec jekyll serve