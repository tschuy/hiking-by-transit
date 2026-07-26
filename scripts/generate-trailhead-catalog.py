#!/usr/bin/env python3
"""Generate and validate the transitional trailhead catalog."""

from __future__ import annotations

import argparse
import copy
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
from trailhead_names import destination_candidates, parse_trailhead_name


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


def read_canonical_kml(copy_public: bool = True) -> tuple[list[dict], list[dict]]:
    records = []
    sources = []
    namespace = {"kml": "http://www.opengis.net/kml/2.2"}
    if copy_public:
        PUBLIC_KML_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for filename in CANONICAL_KML:
        path = KML_DIRECTORY / filename
        public_path = PUBLIC_KML_DIRECTORY / filename
        if copy_public:
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
    parser.add_argument(
        "--check", action="store_true",
        help="validate inputs and confirm committed generated files are current without writing them",
    )
    args = parser.parse_args()

    content = json.loads(args.content.read_text(encoding="utf-8"))
    trailheads = gpd.read_file(args.gpkg, layer="trailheads", fid_as_index=True).to_crs("EPSG:4326")
    access = gpd.read_file(args.gpkg, layer="transit_stop_access", fid_as_index=True).to_crs("EPSG:4326")
    kml_records, kml_sources = read_canonical_kml(copy_public=not args.check)

    names = [" ".join(str(value).split()) for value in trailheads["trailhead_name"]] + [record["name"] for record in kml_records]
    known_destination_names = destination_candidates(names)
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
        name = " ".join(str(row["trailhead_name"]).split())
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
        parsed_name = parse_trailhead_name(name, known_destination_names)
        records.append({
            "id": trailhead_id,
            "slug": slug,
            "name": name,
            "entranceName": parsed_name.entrance_name,
            "destinationNames": list(parsed_name.destination_names),
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
        parsed_name = parse_trailhead_name(record["name"], known_destination_names)
        record["entranceName"] = parsed_name.entrance_name
        record["destinationNames"] = list(parsed_name.destination_names)
        records.append(record)
    records.sort(key=lambda record: (record["name"].casefold(), record["id"]))

    destination_trailheads: dict[str, set[str]] = {}
    destination_display_names: dict[str, str] = {}
    for record in records:
        for destination_name in record.pop("destinationNames"):
            key = destination_name.casefold()
            destination_display_names.setdefault(key, destination_name)
            destination_trailheads.setdefault(key, set()).add(record["id"])

    destination_slug_groups: dict[str, list[str]] = {}
    for key, display_name in destination_display_names.items():
        destination_slug_groups.setdefault(slugify(display_name), []).append(key)

    destinations = []
    destination_id_by_key: dict[str, str] = {}
    for key in sorted(destination_display_names, key=lambda item: destination_display_names[item].casefold()):
        display_name = destination_display_names[key]
        identity = hashlib.sha256(key.encode()).hexdigest()[:12].upper()
        base_slug = slugify(display_name)
        slug = base_slug if len(destination_slug_groups[base_slug]) == 1 else f"{base_slug}-{identity.lower()[:8]}"
        destination_id = f"DEST_{identity}"
        destination_id_by_key[key] = destination_id
        destinations.append({"id": destination_id, "slug": slug, "name": display_name, "trailheadIds": sorted(destination_trailheads[key])})

    for record in records:
        parsed_name = parse_trailhead_name(record["name"], known_destination_names)
        record["destinationIds"] = sorted(destination_id_by_key[name.casefold()] for name in parsed_name.destination_names)

    places = [{
        "id": place["place_id"],
        "slug": place["slug"],
        "title": place["title"],
        "kind": place["kind"].replace("-", "_"),
        "parentId": place.get("parent_id"),
        "blurb": place.get("blurb"),
    } for place in content["places"]]
    destination_by_name = {destination["name"].casefold(): destination for destination in destinations}
    destination_owner: dict[str, str] = {}
    for place in content["places"]:
        for destination_name in place.get("destination_names", []):
            key = destination_name.casefold()
            destination = destination_by_name.get(key)
            if destination is None:
                raise SystemExit(f"Place {place['place_id']} references unknown destination: {destination_name}")
            if key in destination_owner:
                raise SystemExit(f"Destination {destination_name} is owned by both {destination_owner[key]} and {place['place_id']}")
            destination_owner[key] = place["place_id"]
            destination["placeId"] = place["place_id"]
    for destination in destinations:
        destination.setdefault("placeId", None)
    place_by_title = {place["title"].casefold(): place for place in content["places"]}
    for destination in destinations:
        matching_place = place_by_title.get(destination["name"].casefold())
        if matching_place and destination["placeId"] is None:
            raise SystemExit(
                f"Destination {destination['name']} exactly matches place {matching_place['place_id']} but is not listed in its destination_names"
            )
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
            "hikes": len(hikes), "places": len(places), "destinations": len(destinations),
        },
        "trailheads": records, "destinations": destinations, "hikes": hikes, "places": places,
    }

    schema = json.loads(args.schema.read_text(encoding="utf-8"))
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(catalog), key=lambda error: list(error.path))
    if errors:
        raise SystemExit("Catalog validation failed:\n" + "\n".join(f"- {'/'.join(map(str, error.path))}: {error.message}" for error in errors))
    if args.check:
        if not args.output.exists():
            raise SystemExit(f"Generated catalog is missing: {args.output.relative_to(ROOT)}")
        committed = json.loads(args.output.read_text(encoding="utf-8"))
        comparable_catalog = copy.deepcopy(catalog)
        comparable_committed = copy.deepcopy(committed)
        comparable_catalog.pop("generatedAt", None)
        comparable_committed.pop("generatedAt", None)
        comparable_catalog.get("source", {}).pop("gitRevision", None)
        comparable_committed.get("source", {}).pop("gitRevision", None)
        if comparable_catalog != comparable_committed:
            raise SystemExit("Generated catalog is stale; run `npm run generate` and commit the result.")
        stale_kml = [
            filename for filename in CANONICAL_KML
            if not (PUBLIC_KML_DIRECTORY / filename).exists()
            or (KML_DIRECTORY / filename).read_bytes() != (PUBLIC_KML_DIRECTORY / filename).read_bytes()
        ]
        if stale_kml:
            raise SystemExit(
                "Generated public KML is stale; run `npm run generate`: " + ", ".join(stale_kml)
            )
        print(f"Verified generated catalog and {len(CANONICAL_KML)} canonical KML copies.")
        return

    args.output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    try:
        output_label = args.output.relative_to(ROOT)
    except ValueError:
        output_label = args.output
    print(f"Generated {output_label}: {len(records)} trailheads, {len(access)} access records, {len(hikes)} hikes, {len(places)} places, {len(destinations)} destinations")


if __name__ == "__main__":
    main()
