#!/usr/bin/env python3

import argparse
import zipfile
import csv
import sys
from xml.sax.saxutils import escape

from config import gtfs_map


KML_HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>

    <Style id="stop-style">
        <IconStyle>
            <scale>1.4</scale>
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


def read_agency_name(zf):
    if "agency.txt" not in zf.namelist():
        return None

    with zf.open("agency.txt") as f:
        reader = csv.DictReader(line.decode("utf-8") for line in f)
        for row in reader:
            name = row.get("agency_name")
            if name:
                return escape(name)

    return None


def stops_to_kml(gtfs_zip, output_kml):
    with zipfile.ZipFile(gtfs_zip, "r") as zf:
        if "stops.txt" not in zf.namelist():
            raise RuntimeError("stops.txt not found in GTFS zip")

        agency_name = read_agency_name(zf)

        with zf.open("stops.txt") as f:
            reader = csv.DictReader(line.decode("utf-8") for line in f)

            placemarks = []
            for row in reader:
                if not row.get("stop_lat") or not row.get("stop_lon"):
                    continue

                name = escape(row.get("stop_name", ""))
                stop_id = escape(row.get("stop_id", ""))

                description_parts = [f"stop_id: {stop_id}"]
                if agency_name:
                    description_parts.append(f"agency: {agency_name}")

                description = "\n".join(description_parts)

                placemarks.append(f"""
    <Placemark>
        <name>{name}</name>
        <description>{description}</description>
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
    parser.add_argument(
        "--gtfs",
        required=True,
        help=f"GTFS key ({', '.join(sorted(gtfs_map.keys()))})"
    )
    parser.add_argument("--output", required=False, help="Output KML file")
    args = parser.parse_args()

    if args.gtfs not in gtfs_map:
        print(f"Unknown GTFS key: {args.gtfs}", file=sys.stderr)
        print(f"Valid options: {', '.join(sorted(gtfs_map.keys()))}", file=sys.stderr)
        sys.exit(1)

    gtfs_zip = gtfs_map[args.gtfs]["path"]
    output_filename = args.output
    if not args.output:
        output_filename = f"./output/{args.gtfs}.kml"
    else:
        output_filename = args.output
    stops_to_kml(gtfs_zip, output_filename)


if __name__ == "__main__":
    main()