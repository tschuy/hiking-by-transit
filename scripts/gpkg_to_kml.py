#!/usr/bin/env python3

import sys
import geopandas as gpd
import pandas as pd
import html
import math
import re

from constants import url_to_route_map, agency_map

def normalize_stop_name(stop_name: str) -> str:
    if not stop_name or not stop_name.isupper():
        return stop_name

    # Split out parenthetical parts
    parts = re.split(r"(\([^)]*\))", stop_name)

    normalized = []
    for part in parts:
        if part.startswith("(") and part.endswith(")"):
            # Keep parentheticals exactly as-is
            normalized.append(part)
        else:
            # Title-case the non-parenthetical text
            normalized.append(part.title())

    return "".join(normalized)


def frequency_label(trips_per_day: int) -> str:
    if trips_per_day <= 0:
        return "No service"
    elif trips_per_day == 1:
        return f"{trips_per_day} trip a day"
    elif trips_per_day < 10:
        return f"{trips_per_day} trips a day"
    elif trips_per_day < 18:
        return "Every 1–2 hours"
    elif trips_per_day < 30:
        return "About hourly"
    elif trips_per_day < 50:
        return "Every 30–45 minutes"
    elif trips_per_day < 75:
        return "Every 20–30 minutes"
    else:
        return "Frequent service"

def service_description(weekday, saturday, sunday):
    values = {
        "Weekday": weekday,
        "Saturday": saturday,
        "Sunday": sunday,
    }

    results = {day: frequency_label(v) for day, v in values.items()}
    if results["Weekday"] == results["Saturday"] == results["Sunday"]:
        return f"<ul><li>7 days a week: {results['Weekday']}</li></ul>"
    if results["Saturday"] == results["Sunday"]:
        return f"<ul><li>Weekday: {results['Weekday']}</li><li>Weekend: {results['Saturday']}</li></ul>"
    return f"<ul><li>Weekday: {results['Weekday']}</li><li>Saturday: {results['Saturday']}</li><li>Sunday: {results['Sunday']}</li></ul>"

def safe_str(value):
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    return str(value)


def xml_escape(value):
    return html.escape(safe_str(value), quote=True)


def cdata_safe(value):
    # CDATA cannot contain ']]>'
    return safe_str(value).replace("]]>", "]]&gt;")


def write_kml(filename, placemarks, style_id, color):
    if not placemarks:
        return

    with open(filename, "w", encoding="utf-8") as f:
        f.write("<kml><Document>\n")

        # --- Style ---
        f.write(f"""
  <Style id="{style_id}">
    <IconStyle>
      <color>{color}</color>
      <scale>0.4</scale>
      <Icon>
        <href>/assets/pin.png</href>
      </Icon>
    </IconStyle>
  </Style>
""")

        for pm in placemarks:
            f.write(pm)

        f.write("</Document></kml>\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python gpkg_to_kml.py <gpkg_file>")
        sys.exit(1)

    gpkg_file = sys.argv[1]

    trailheads = gpd.read_file(gpkg_file, layer="trailheads")
    transit_access = gpd.read_file(gpkg_file, layer="transit_stop_access")

    outputs = {
        "rail": [],
        "rail-far": [],
        "bus": [],
        "bus-far": [],
        "bus-weekday-only": [],
    }

    for _, trailhead in trailheads.iterrows():
        trailhead_id = trailhead.get("trailhead_id")
        trailhead_name = xml_escape(trailhead.get("trailhead_name")) or "N/A"
        trailhead_notes = cdata_safe(trailhead.get("notes"))
        if trailhead_notes:
            trailhead_notes += " <br>" # space is necessary for URL parsing of notes

        lon, lat = trailhead.geometry.x, trailhead.geometry.y

        matching_access = transit_access[
            transit_access["trailhead_id"] == trailhead_id
        ]

        has_rail = False
        has_bus = False

        rail_min_walk = None
        bus_min_walk = None
        bus_has_saturday = False

        description_lines = [
            "<![CDATA[",
            trailhead_notes,
        ]

        for _, access in matching_access.iterrows():
            stop_name = cdata_safe(access.get("stop_name"))
            stop_name = normalize_stop_name(stop_name)
            access_notes = cdata_safe(access.get("notes"))

            # walk time: null means it's a special trailhead, where the notes field has more info
            if not math.isnan(access.get("walk_time_min", -1)):
                walk_time = int(round(access.get("walk_time_min", -1)))
            else:
                walk_time = -1

            times_per_weekday = access.get("weekday_frequency", 0)
            weekday = int(round(access.get("weekday_frequency", 0)))
            saturday = int(round(access.get("saturday_frequency", 0)))
            sunday = int(round(access.get("sunday_frequency", 0)))

            routes_served = safe_str(access.get("routes_served")).split(",")
            gtfs_url = access.get("gtfs_source")

            route_map = url_to_route_map.get(gtfs_url, {})
            agency_info_map = agency_map.get(gtfs_url, {})

            route_strings = []

            for rid in routes_served:
                if not rid:
                    continue

                info = route_map.get(rid, route_map.get(rid.strip(), route_map.get(rid.lstrip("0"))))
                if not info:
                    print(rid, type(rid), route_map.keys(), stop_name)
                    route_strings.append(f"UNKNOWN({rid})")
                    has_bus = True
                    bus_min_walk = walk_time if bus_min_walk is None else min(bus_min_walk, walk_time)
                    if saturday != 0:
                        bus_has_saturday = True
                    continue

                agency_id = info["agency_id"]
                agency = agency_info_map.get(agency_id, {})
                agency_type = agency.get("type", "bus")

                route_name = str(info["route_short_name"])
                if route_name == "nan": route_name = info["route_long_name"]
                route_name = route_name.removesuffix('-N')
                route_name = route_name.removesuffix('-S')
                if route_name == "SMART": route_name = "" # workaround to route and agency name matching

                filter_routes = agency.get("filter_function", lambda x: False)
                if filter_routes(rid):
                    continue

                route_strings.append(
                    f"{agency.get('short_name', agency.get('long_name', 'UNKNOWN'))} {route_name} {info.get('note', '')}".strip()
                )

                if agency_type == "rail":
                    has_rail = True
                    rail_min_walk = walk_time if rail_min_walk is None else min(rail_min_walk, walk_time)
                else:
                    has_bus = True
                    bus_min_walk = walk_time if bus_min_walk is None else min(bus_min_walk, walk_time)
                    if saturday != 0:
                        bus_has_saturday = True

            description_lines.append(f"<h4>Stop: {stop_name}</h4>")
            if access_notes:
                description_lines.append(access_notes)
                description_lines.append("<br>")
            if walk_time >=0:
                description_lines.append(f"<b>{walk_time} min walk</b><br>")
            description_lines.append(f"Served by {', '.join(sorted(set(route_strings)))}")
            if times_per_weekday < 1 and saturday == 0:
                # if it's not a weekend-only service, and it's served less than once daily, special message
                description_lines.append("<ul><li>Served less than once daily. Check schedules for details.</li></ul>")
            else:
                description_lines.append(service_description(weekday, saturday, sunday))
            description_lines.append("")

        description_lines.append("]]>")
        description = "\n".join(description_lines)

        def placemark(style_id):
            return f"""
  <Placemark>
    <name>{trailhead_name}</name>
    <description>
{description}
    </description>
    <styleUrl>#{style_id}</styleUrl>
    <Point>
      <coordinates>{lon},{lat},0</coordinates>
    </Point>
  </Placemark>
"""

        if has_rail:
            if rail_min_walk is not None and rail_min_walk <= 20:
                outputs["rail"].append(placemark("rail"))
            else:
                outputs["rail-far"].append(placemark("rail-far"))

        if has_bus:
            if bus_has_saturday:
                if bus_min_walk is not None and bus_min_walk <= 15:
                    outputs["bus"].append(placemark("bus"))
                else:
                    outputs["bus-far"].append(placemark("bus-far"))
            else:
                outputs["bus-weekday-only"].append(placemark("bus-weekday-only"))

    write_kml("../jekyll/assets/kml/rail.kml", outputs["rail"], "rail", "ff007cf5")
    write_kml("../jekyll/assets/kml/rail-far.kml", outputs["rail-far"], "rail-far", "ff0051e6")
    write_kml("../jekyll/assets/kml/bus.kml", outputs["bus"], "bus", "ffd18802")
    write_kml("../jekyll/assets/kml/bus-far.kml", outputs["bus-far"], "bus-far", "ffa79700")
    write_kml("../jekyll/assets/kml/bus-weekday-only.kml", outputs["bus-weekday-only"], "bus-weekday-only", "ff7e231a")

if __name__ == "__main__":
    main()