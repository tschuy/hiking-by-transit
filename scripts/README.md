# Readme

## KML Processor

Munges a My Maps KML export into a set of KML files usable by Hiking by Transit.

* In Google My Maps, "Export to KML/KMZ", select Entire map and check "Export as KML instead of KMZ"
* KML supports folders, and the export contains each layer of the My Map as a folder; OpenLayers does not let us manipulate by folder, so we need to store each folder in its own KML

To update the website, download new My Maps export, and run `./kml.py "~/path/to/exported.kml" ../assets/kml/ kmlmap.json`.