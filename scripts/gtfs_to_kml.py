#!/usr/bin/env python3

import argparse
import zipfile
import csv
from xml.sax.saxutils import escape

KML_HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>

    <Style id="stop-style">
        <IconStyle>
            <!-- Scale > 1.0 makes it bigger -->
            <scale>1.4</scale>

            <!-- aabbggrr : ff0000ff = red -->
            <color>ff0000ff</color>

            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
"""

KML_FOOTER = """</Document>
</kml>
"""

def stops_to_kml(gtfs_zip, output_kml):
    with zipfile.ZipFile(gtfs_zip, "r") as zf:
        if "stops.txt" not in zf.namelist():
            raise RuntimeError("stops.txt not found in GTFS zip")

        with zf.open("stops.txt") as f:
            reader = csv.DictReader(
                (line.decode("utf-8") for line in f)
            )

            placemarks = []
            for row in reader:
                if not row.get("stop_lat") or not row.get("stop_lon"):
                    continue

                name = escape(row.get("stop_name", ""))
                stop_id = escape(row.get("stop_id", ""))

                placemarks.append(f"""
    <Placemark>
        <name>{name}</name>
        <description>stop_id: {stop_id}</description>
        <styleUrl>#stop-style</styleUrl>
        <Point>
            <coordinates>{row['stop_lon']},{row['stop_lat']},0</coordinates>
        </Point>
    </Placemark>
                """)

    with open(output_kml, "w", encoding="utf-8") as out:
        out.write(KML_HEADER)
        out.write("\n".join(placemarks))
        out.write(KML_FOOTER)

    print(f"Wrote {len(placemarks)} stops to {output_kml}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gtfs", required=True, help="Path to GTFS zip")
    parser.add_argument("--output", required=True, help="Output KML file")
    args = parser.parse_args()

    stops_to_kml(args.gtfs, args.output)


if __name__ == "__main__":
    main()