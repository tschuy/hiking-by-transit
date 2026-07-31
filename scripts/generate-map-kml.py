#!/usr/bin/env python3
"""Generate the fixed-route KML layers consumed by the trailhead map."""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "src" / "data" / "catalog-v0.9.generated.json"
DEFAULT_CONFIG = ROOT / "public" / "assets" / "data" / "config.json"
DEFAULT_OUTPUT_DIRECTORY = ROOT / "public" / "assets" / "kml"
LAYERS = {
    "rail": ("rail", "ff007cf5"),
    "rail-far": ("rail-far", "ff0051e6"),
    "bus": ("bus", "ffd18802"),
    "bus-far": ("bus-far", "ffa79700"),
    "bus-weekday-only": ("bus-weekday-only", "ff7e231a"),
}


def frequency_label(value: float) -> str:
    trips = max(1, round(value))
    if trips == 1:
        return "1 trip a day"
    if trips < 10:
        return f"{trips} trips a day"
    if trips < 18:
        return "Every 1–2 hours"
    if trips < 30:
        return "About hourly"
    if trips < 50:
        return "Every 30–45 minutes"
    if trips < 75:
        return "Every 20–30 minutes"
    return "Frequent service"


def service_description(frequency: dict[str, float | None]) -> str:
    values = {day: max(0, value or 0) for day, value in frequency.items()}
    labels = {day: frequency_label(value) if value > 0 else "No service" for day, value in values.items()}
    if labels["weekday"] == labels["saturday"] == labels["sunday"]:
        return f"<ul><li>7 days a week: {labels['weekday']}</li></ul>"
    if labels["saturday"] == labels["sunday"]:
        return f"<ul><li>Weekday: {labels['weekday']}</li><li>Weekend: {labels['saturday']}</li></ul>"
    return (
        f"<ul><li>Weekday: {labels['weekday']}</li><li>Saturday: {labels['saturday']}</li>"
        f"<li>Sunday: {labels['sunday']}</li></ul>"
    )


def hidden_by_filter(filter_name: str | None, route_id: str) -> bool:
    try:
        number = int(route_id.split(":")[-1])
    except ValueError:
        return False
    if filter_name == "sixhundred_filter":
        return number >= 600
    if filter_name == "samtrans_filter":
        return number < 100
    if filter_name == "ggt_filter":
        return number not in {101, 130, 150, 580}
    return False


def route_context(config: dict, source: str | None, agency_id: str | None) -> dict:
    matching_feed = next((feed for feed in config["feeds"].values() if feed.get("gtfs", {}).get("url") == source), None)
    if not matching_feed:
        return {}
    agencies = matching_feed.get("agencies", {})
    if agency_id in agencies:
        return agencies[agency_id]
    return next(iter(agencies.values())) if len(agencies) == 1 else {}


def clean_route_name(value: str) -> str:
    return re.sub(r"-(?:N|S)$", "", value, flags=re.IGNORECASE).lstrip("0") or "0"


def render_kml(placemarks: list[str], style_id: str, color: str) -> str:
    return "".join([
        "<kml><Document>\n",
        f'''\n  <Style id="{style_id}">
    <IconStyle>
      <color>{color}</color>
      <scale>0.4</scale>
      <Icon>
        <href>/assets/pin.png</href>
      </Icon>
    </IconStyle>
  </Style>
''',
        *placemarks,
        "</Document></kml>\n",
    ])


def generate(catalog: dict, config: dict) -> dict[str, str]:
    route_metadata = {(route["gtfsSource"], route["id"]): route for route in catalog["routes"]}
    outputs: dict[str, list[str]] = {layer: [] for layer in LAYERS}

    for trailhead in catalog["trailheads"]:
        if not trailhead["access"]:
            continue
        description_lines = ["<![CDATA["]
        if trailhead["notes"]:
            description_lines.extend([str(trailhead["notes"]).replace("]]>", "]]&gt;"), "<br>"])
        has_rail = has_bus = bus_has_saturday = False
        rail_walks: list[float] = []
        bus_walks: list[float] = []

        for access in trailhead["access"]:
            routes = []
            access_has_rail = access_has_bus = False
            for route_id in access["routeIds"]:
                metadata = route_metadata.get((access["gtfsSource"], route_id), {})
                agency = route_context(config, access["gtfsSource"], metadata.get("agencyId"))
                route_settings = agency.get("routes", {}).get(route_id, {})
                if route_settings.get("hidden") or hidden_by_filter(agency.get("filter_function"), route_id):
                    continue
                route_type = agency.get("type", "bus")
                if route_type == "rail":
                    has_rail = access_has_rail = True
                else:
                    has_bus = access_has_bus = True
                agency_name = agency.get("short_name") or agency.get("long_name") or metadata.get("agencyId") or ""
                display_name = clean_route_name(metadata.get("shortName") or metadata.get("longName") or route_id.split(":")[-1])
                if display_name == agency_name or display_name == "SMART":
                    display_name = ""
                note = route_settings.get("note", "")
                routes.append(" ".join(part for part in (agency_name, display_name, note) if part).strip())

            walk = access["walkMinutes"] if access["walkMinutes"] is not None else -1
            if access_has_rail:
                rail_walks.append(walk)
            if access_has_bus:
                bus_walks.append(walk)
                bus_has_saturday = bus_has_saturday or bool((access["frequency"]["saturday"] or 0) > 0)
            description_lines.append(f"<h4>Stop: {html.escape(access['stopName'])}</h4>")
            if access["notes"]:
                description_lines.extend([str(access["notes"]).replace("]]>", "]]&gt;"), "<br>"])
            if walk >= 0:
                description_lines.append(f"<b>{round(walk)} min walk</b><br>")
            description_lines.append(f"Served by {', '.join(sorted(set(routes)))}")
            if (access["frequency"]["weekday"] or 0) < 1 and (access["frequency"]["saturday"] or 0) == 0:
                description_lines.append("<ul><li>Served less than once daily. Check schedules for details.</li></ul>")
            else:
                description_lines.append(service_description(access["frequency"]))

        description_lines.append("]]>")
        description = "\n".join(description_lines)
        longitude, latitude = trailhead["coordinates"]
        placemark = f'''\n  <Placemark>
    <name>{html.escape(trailhead['name'])}</name>
    <description>
{description}
    </description>
    <styleUrl>#{{style_id}}</styleUrl>
    <Point>
      <coordinates>{longitude},{latitude},0</coordinates>
    </Point>
  </Placemark>
'''
        if has_rail:
            layer = "rail" if rail_walks and min(rail_walks) <= 20 else "rail-far"
            outputs[layer].append(placemark.format(style_id=layer))
        if has_bus:
            layer = "bus-weekday-only" if not bus_has_saturday else "bus" if bus_walks and min(bus_walks) <= 15 else "bus-far"
            outputs[layer].append(placemark.format(style_id=layer))

    return {layer: render_kml(outputs[layer], *LAYERS[layer]) for layer in LAYERS}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output-directory", type=Path, default=DEFAULT_OUTPUT_DIRECTORY)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    generated = generate(json.loads(args.catalog.read_text()), json.loads(args.config.read_text()))
    stale = [f"{layer}.kml" for layer, content in generated.items() if not (args.output_directory / f"{layer}.kml").exists() or (args.output_directory / f"{layer}.kml").read_text() != content]
    if args.check:
        if stale:
            raise SystemExit("Generated map KML is stale; run `npm run generate`: " + ", ".join(stale))
        print(f"Verified {len(generated)} generated map KML layers.")
        return
    args.output_directory.mkdir(parents=True, exist_ok=True)
    for layer, content in generated.items():
        (args.output_directory / f"{layer}.kml").write_text(content)
    print(f"Generated {len(generated)} map KML layers from {len(json.loads(args.catalog.read_text())['trailheads'])} trailheads.")


if __name__ == "__main__":
    main()
