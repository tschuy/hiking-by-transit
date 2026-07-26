#!/usr/bin/env python3
"""Generate and validate the transitional trailhead catalog."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import geopandas as gpd
import pandas as pd
from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GPKG = ROOT / "data" / "transit_accessible_trailheads.gpkg"
DEFAULT_CONTENT = ROOT / "src" / "data" / "content.generated.json"
DEFAULT_SCHEMA = ROOT / "data-contract" / "catalog-v0.9.schema.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "catalog-v0.9.generated.json"
KML_DIRECTORY = ROOT / "data" / "kml"
PUBLIC_KML_DIRECTORY = ROOT / "public" / "assets" / "kml"
CANONICAL_KML = ("shuttles.kml", "microtransit.kml", "call-ahead.kml")


def nullable(value):
    return None if value is None or bool(pd.isna(value)) else value


def text(value):
    value = nullable(value)
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def number(value):
    value = nullable(value)
    return None if value is None else max(0, float(value))


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "trailhead"


def git_revision() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, check=True,
        capture_output=True, text=True,
    ).stdout.strip()


def plain_kml_description(value: str | None) -> str | None:
    if not value:
        return None
    value = html.unescape(value)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\s*\n\s*", "\n", value).strip()
    return value or None


def read_canonical_kml() -> tuple[list[dict], list[dict]]:
    records = []
    sources = []
    namespace = {"kml": "http://www.opengis.net/kml/2.2"}
    PUBLIC_KML_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for filename in CANONICAL_KML:
        path = KML_DIRECTORY / filename
        public_path = PUBLIC_KML_DIRECTORY / filename
        shutil.copyfile(path, public_path)
        sources.append({
            "path": str(path.relative_to(ROOT)),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "publicPath": str(public_path.relative_to(ROOT)),
        })
        category = path.stem
        root = ET.parse(path).getroot()
        for placemark in root.findall(".//kml:Placemark", namespace):
            name = " ".join((placemark.findtext("kml:name", default="", namespaces=namespace)).split())
            coordinate_text = placemark.findtext("kml:Point/kml:coordinates", default="", namespaces=namespace).strip()
            coordinates = [float(value.strip()) for value in coordinate_text.split(",")[:2]]
            description = plain_kml_description(placemark.findtext("kml:description", namespaces=namespace))
            identity = hashlib.sha256(f"{category}|{name}|{coordinates[0]:.8f}|{coordinates[1]:.8f}".encode()).hexdigest()[:12].upper()
            lowered = (description or "").lower()
            records.append({
                "id": f"KML_{category.replace('-', '_').upper()}_{identity}",
                "name": name,
                "coordinates": coordinates,
                "notes": description,
                "access": [],
                "hikeIds": [],
                "placeIds": [],
                "serviceDays": [],
                "reservationRequirement": True if "reservation required" in lowered else "unknown",
                "seasonalService": True if "seasonal" in lowered or "summer only" in lowered else "unknown",
            })
    return records, sources


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gpkg", type=Path, default=DEFAULT_GPKG)
    parser.add_argument("--content", type=Path, default=DEFAULT_CONTENT)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    content = json.loads(args.content.read_text(encoding="utf-8"))
    trailheads = gpd.read_file(args.gpkg, layer="trailheads", fid_as_index=True).to_crs("EPSG:4326")
    access = gpd.read_file(args.gpkg, layer="transit_stop_access", fid_as_index=True).to_crs("EPSG:4326")
    kml_records, kml_sources = read_canonical_kml()

    names = [str(value).strip() for value in trailheads["trailhead_name"]] + [record["name"] for record in kml_records]
    slug_counts: dict[str, int] = {}
    for name in names:
        base = slugify(name)
        slug_counts[base] = slug_counts.get(base, 0) + 1

    hikes = [{
        "id": hike["hike_id"],
        "slug": hike["slug"],
        "title": hike["title"],
        "trailheadIds": hike.get("trailhead_ids", []),
        "placeIds": hike["place_ids"],
        "difficulty": hike["difficulty"],
        "lengthLabel": hike["length"],
        "tags": hike.get("tags", []),
        "gpx": hike.get("gpx"),
        "image": hike.get("image"),
        "blurb": hike.get("blurb"),
    } for hike in content["hikes"]]
    hike_ids_by_trailhead: dict[str, list[str]] = {}
    place_ids_by_trailhead: dict[str, set[str]] = {}
    for hike in hikes:
        for trailhead_id in hike["trailheadIds"]:
            hike_ids_by_trailhead.setdefault(trailhead_id, []).append(hike["id"])
            place_ids_by_trailhead.setdefault(trailhead_id, set()).update(hike["placeIds"])

    records = []
    for _, row in trailheads.sort_values("trailhead_id").iterrows():
        trailhead_id = str(row["trailhead_id"])
        name = str(row["trailhead_name"]).strip()
        base_slug = slugify(name)
        slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{trailhead_id.lower().replace('_', '-')}"
        matching = access[access["trailhead_id"] == trailhead_id].sort_index()
        access_records = []
        service_days: set[str] = set()
        for _, item in matching.iterrows():
            frequency = {
                "weekday": number(item.get("weekday_frequency")),
                "saturday": number(item.get("saturday_frequency")),
                "sunday": number(item.get("sunday_frequency")),
            }
            service_days.update(day for day, count in frequency.items() if count is not None and count > 0)
            route_ids = sorted({route.strip() for route in (text(item.get("routes_served")) or "").split(",") if route.strip()})
            access_records.append({
                "sourceFid": int(item.name),
                "id": str(item["access_id"]),
                "stopId": text(item.get("stop_id")),
                "stopName": str(item["stop_name"]).strip(),
                "coordinates": [float(item.geometry.x), float(item.geometry.y)],
                "walkMinutes": number(item.get("walk_time_min")),
                "walkSource": str(item["walk_source"]).strip(),
                "notes": text(item.get("notes")),
                "gtfsSource": text(item.get("gtfs_source")),
                "frequency": frequency,
                "routeIds": route_ids,
            })
        records.append({
            "id": trailhead_id,
            "slug": slug,
            "name": name,
            "coordinates": [float(row.geometry.x), float(row.geometry.y)],
            "notes": text(row.get("notes")),
            "access": access_records,
            "hikeIds": sorted(hike_ids_by_trailhead.get(trailhead_id, [])),
            "placeIds": sorted(place_ids_by_trailhead.get(trailhead_id, set())),
            "serviceDays": sorted(service_days),
            "reservationRequirement": "unknown",
            "seasonalService": "unknown",
        })

    for record in kml_records:
        base_slug = slugify(record["name"])
        record["slug"] = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{record['id'].lower().replace('_', '-')}"
        records.append(record)
    records.sort(key=lambda record: (record["name"].casefold(), record["id"]))

    places = [{
        "id": place["place_id"],
        "slug": place["slug"],
        "title": place["title"],
        "kind": place["kind"].replace("-", "_"),
        "parentId": place.get("parent_id"),
        "blurb": place.get("blurb"),
    } for place in content["places"]]
    catalog = {
        "schemaVersion": "0.9",
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "gpkgPath": str(args.gpkg.relative_to(ROOT)),
            "gpkgSha256": hashlib.sha256(args.gpkg.read_bytes()).hexdigest(),
            "contentPath": str(args.content.relative_to(ROOT)),
            "kmlSources": kml_sources,
            "gitRevision": git_revision(),
        },
        "counts": {
            "trailheads": len(records), "accessRecords": len(access),
            "hikes": len(hikes), "places": len(places),
        },
        "trailheads": records, "hikes": hikes, "places": places,
    }

    schema = json.loads(args.schema.read_text(encoding="utf-8"))
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(catalog), key=lambda error: list(error.path))
    if errors:
        raise SystemExit("Catalog validation failed:\n" + "\n".join(f"- {'/'.join(map(str, error.path))}: {error.message}" for error in errors))
    args.output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    try:
        output_label = args.output.relative_to(ROOT)
    except ValueError:
        output_label = args.output
    print(f"Generated {output_label}: {len(records)} trailheads, {len(access)} access records, {len(hikes)} hikes, {len(places)} places")


if __name__ == "__main__":
    main()
