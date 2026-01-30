#!/usr/bin/env python3

import argparse

import geopandas as gpd

from constants import gtfs_map
from stop_summary import get_stop_summary


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

    gdf = gpd.read_file(args.gpkg, layer="transit_stop_access")

    mask = gdf["gtfs_source"] == gtfs_url
    matching = gdf[mask]

    if matching.empty:
        print("No transit_stop_access records match this GTFS source.")
        return

    print(f"\nUpdating {len(matching)} transit_stop_access records...\n")

    updated = 0

    for idx, row in matching.iterrows():
        stop_id = row.stop_id
        access_id = row.access_id

        summary = get_stop_summary(stop_id, gtfs_path)

        old_weekday = row.weekday_frequency
        old_sat = row.saturday_frequency
        old_sun = row.sunday_frequency

        new_weekday = summary["weekday_counts"]
        new_sat = summary["saturday_counts"]
        new_sun = summary["sunday_counts"]

        if (
            old_weekday != new_weekday
            or old_sat != new_sat
            or old_sun != new_sun
        ):
            print(f"Access ID: {access_id}")
            print(f"  Stop ID: {stop_id}")

            print(f"  Weekday:  {old_weekday} → {new_weekday}")
            print(f"  Saturday: {old_sat} → {new_sat}")
            print(f"  Sunday:   {old_sun} → {new_sun}")

            gdf.at[idx, "weekday_frequency"] = new_weekday
            gdf.at[idx, "saturday_frequency"] = new_sat
            gdf.at[idx, "sunday_frequency"] = new_sun

            updated += 1
            print("-" * 60)

    if updated == 0:
        print("✔ All frequencies already up to date.")
        return

    # Write back to GeoPackage
    gdf.to_file(
        args.gpkg,
        layer="transit_stop_access",
        mode="w",
    )

    print(f"\n✔ Updated frequency fields for {updated} records.")


if __name__ == "__main__":
    main()
