#!/usr/bin/env python3

import argparse
import sys
import zipfile

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

from constants import gtfs_map
from stop_summary import get_stop_summary


MAX_RADIUS_METERS = 4828.03 # 3 miles


def load_stops(gtfs_path):
    with zipfile.ZipFile(gtfs_path, "r") as zf:
        if "stops.txt" not in zf.namelist():
            raise RuntimeError("GTFS feed does not contain stops.txt")
        with zf.open("stops.txt") as f:
            return pd.read_csv(
                f,
                dtype={"stop_id": str, "stop_name": str},
            )


def generate_trailhead_id(name):
    return f"TH_{abs(hash(name)) % 10_000_000}"


def prompt_lat_lon():
    while True:
        try:
            lat = float(input("Trailhead latitude: ").strip())
            lon = float(input("Trailhead longitude: ").strip())
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError
            return lat, lon
        except ValueError:
            print("Please enter valid latitude/longitude values.")


def prompt_for_trailhead(gpkg_path):
    trailheads = gpd.read_file(gpkg_path, layer="trailheads")

    print("\nTrailheads:")
    for i, row in trailheads.iterrows():
        print(f"{i + 1:4d}. {row.trailhead_name}")

    print("\nN. Add a new trailhead")

    while True:
        choice = input("\nSelect a trailhead or 'N': ").strip()

        if choice.lower() == "n":
            name = input("New trailhead name (required): ").strip()
            if not name:
                print("Trailhead name is required.")
                continue

            trailhead_id = generate_trailhead_id(name)
            if trailhead_id in set(trailheads.trailhead_id):
                raise RuntimeError(
                    f"Trailhead ID {trailhead_id} already exists. "
                    "Rename trailhead to avoid collision."
                )

            lat, lon = prompt_lat_lon()
            notes = input("Notes (optional, press Enter to skip): ").strip() or None

            return {
                "trailhead_id": trailhead_id,
                "trailhead_name": name,
                "notes": notes,
                "geometry": Point(lon, lat),
                "is_new": True,
            }

        if not choice.isdigit():
            print("Invalid selection.")
            continue

        idx = int(choice) - 1
        if idx < 0 or idx >= len(trailheads):
            print("Selection out of range.")
            continue

        row = trailheads.iloc[idx]
        return {
            "trailhead_id": row.trailhead_id,
            "trailhead_name": row.trailhead_name,
            "notes": row.notes,
            "geometry": row.geometry,
            "is_new": False,
        }


def prompt_for_nearby_stop(stops_df, trailhead_geom):
    stops_gdf = gpd.GeoDataFrame(
        stops_df,
        geometry=gpd.points_from_xy(
            stops_df.stop_lon.astype(float),
            stops_df.stop_lat.astype(float),
        ),
        crs="EPSG:4326",
    )

    trailhead_pt = (
        gpd.GeoSeries([trailhead_geom], crs="EPSG:4326")
        .to_crs("EPSG:3857")
        .iloc[0]
    )

    stops_3857 = stops_gdf.to_crs("EPSG:3857")
    stops_3857["distance_m"] = stops_3857.geometry.distance(trailhead_pt)

    nearby = (
        stops_3857[stops_3857["distance_m"] <= MAX_RADIUS_METERS]
        .sort_values("distance_m")
        .reset_index(drop=True)
    )

    if nearby.empty:
        raise RuntimeError("No stops found within 3 miles of this trailhead.")

    print("\nNearby stops (within 3 miles):")
    for i, row in nearby.iterrows():
        miles = row.distance_m / 1609.34
        print(f"{i + 1:4d}. {row.stop_name} ({miles:.2f} mi)")

    while True:
        choice = input("\nSelect a stop: ").strip()
        if not choice.isdigit():
            print("Invalid selection.")
            continue

        idx = int(choice) - 1
        if idx < 0 or idx >= len(nearby):
            print("Selection out of range.")
            continue

        return nearby.iloc[idx].stop_id.strip()


def prompt_for_walk_time():
    while True:
        val = input("Enter walk time in minutes (0 or greater): ").strip()
        try:
            walk_time = int(val)
            if walk_time < 0:
                raise ValueError
            return walk_time
        except ValueError:
            print("Please enter an integer ≥ 0.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gtfs", required=True)
    parser.add_argument("--gpkg", required=True)
    args = parser.parse_args()

    if args.gtfs not in gtfs_map:
        raise RuntimeError(f"Unknown GTFS key: {args.gtfs}")

    gtfs_info = gtfs_map[args.gtfs]
    gtfs_path = gtfs_info["path"]
    gtfs_url = gtfs_info["url"]

    trailhead = prompt_for_trailhead(args.gpkg)
    stops_df = load_stops(gtfs_path)

    stop_id = prompt_for_nearby_stop(stops_df, trailhead["geometry"])
    summary = get_stop_summary(stop_id, gtfs_path)

    walk_time_min = prompt_for_walk_time()
    notes = input("Notes (optional, press Enter to skip): ").strip() or None

    access_id = f"ACC_{trailhead['trailhead_id']}_{stop_id}"

    access_gdf = gpd.read_file(args.gpkg, layer="transit_stop_access")
    if access_id in set(access_gdf.access_id):
        raise RuntimeError(f"access_id {access_id} already exists.")

    # Write new trailhead if needed
    if trailhead["is_new"]:
        th_gdf = gpd.GeoDataFrame(
            [
                {
                    "trailhead_id": trailhead["trailhead_id"],
                    "trailhead_name": trailhead["trailhead_name"],
                    "notes": trailhead["notes"],
                    "geometry": trailhead["geometry"],
                }
            ],
            crs="EPSG:4326",
        )
        th_gdf.to_file(args.gpkg, layer="trailheads", mode="a")

    # Write transit_stop_access
    tsa_gdf = gpd.GeoDataFrame(
        [
            {
                "access_id": access_id,
                "trailhead_id": trailhead["trailhead_id"],
                "stop_id": stop_id,
                "stop_name": summary["stop_name"],
                "walk_time_min": walk_time_min,
                "walk_source": "routed",
                "notes": notes,
                "gtfs_source": gtfs_url,
                "weekday_frequency": summary["weekday_counts"],
                "saturday_frequency": summary["saturday_counts"],
                "sunday_frequency": summary["sunday_counts"],
                "routes_served": ",".join(summary["route_ids"]),
                "geometry": Point(summary["stop_lon"], summary["stop_lat"]),
            }
        ],
        crs="EPSG:4326",
    )

    tsa_gdf.to_file(args.gpkg, layer="transit_stop_access", mode="a")

    print("\n✔ Transit stop access written successfully.")
    if trailhead["is_new"]:
        print("✔ New trailhead added.")


if __name__ == "__main__":
    main()
