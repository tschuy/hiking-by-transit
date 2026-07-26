#!/usr/bin/env python3

# 06-2025 Summary - 06-2025 GTFS, 01-2026 trailheads:
#   Stops served: 233
#   Total weekly services: 45917
#   Average per stop: 197

# 01-2026 Summary - 01-2026 GTFS and trailheads:
#   Stops served: 236
#   Total weekly services: 60155
#   Average per stop: 254

# This primarily reflects the addition of Joaquin Miller bus
# service. One bus stopping at multiple trailheads along the
# way is counted multiple times.


import geopandas as gpd
import pandas as pd
import zipfile
from collections import defaultdict

# ------------------
# CONFIG
# ------------------

GPKG_PATH = "../data/transit_accessible_trailheads.gpkg"
LAYER_NAME = "transit_stop_access"

gtfs = {
    "http://api.511.org/transit/datafeeds": "./gtfs/bayarea.zip",
}

# Representative week for calendar_dates-only feeds
CAL_DATES_START = "2025-06-02"
CAL_DATES_END   = "2025-06-08"


def load_gtfs_tables(gtfs_zip_path, tables):
    """Load selected GTFS tables into a dict of DataFrames."""
    out = {}
    with zipfile.ZipFile(gtfs_zip_path, "r") as zf:
        for table in tables:
            fname = f"{table}.txt"
            if fname not in zf.namelist():
                raise ValueError(f"{fname} not found in {gtfs_zip_path}")
            with zf.open(fname) as f:
                out[table] = pd.read_csv(f, dtype=str)
    return out


def compute_trips_per_week(calendar_df):
    """Compute service days per week from calendar.txt."""
    day_cols = [
        "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday"
    ]

    calendar_df = calendar_df.copy()
    calendar_df[day_cols] = calendar_df[day_cols].astype(int)
    calendar_df["service_days_per_week"] = calendar_df[day_cols].sum(axis=1)

    return calendar_df[["service_id", "service_days_per_week"]]


def compute_service_days_from_calendar_dates(
    calendar_dates_df,
    start_date,
    end_date
):
    """Compute service days in a date range from calendar_dates.txt."""
    df = calendar_dates_df.copy()

    df["date"] = pd.to_datetime(df["date"], format="%Y%m%d")
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)

    df = df[
        (df["date"] >= start) &
        (df["date"] <= end) &
        (df["exception_type"].astype(int) == 1)
    ]

    return (
        df.groupby("service_id")
        .size()
        .reset_index(name="service_days_per_week")
    )


def main():
    gdf = gpd.read_file(GPKG_PATH, layer=LAYER_NAME)

    # group stop_ids by gtfs_source
    source_to_stop_ids = defaultdict(set)

    for _, row in gdf.iterrows():
        if pd.isna(row.get("gtfs_source")) or pd.isna(row.get("stop_id")):
            continue
        source_to_stop_ids[row["gtfs_source"]].add(str(row["stop_id"]))

    for gtfs_source, stop_ids in source_to_stop_ids.items():
        if gtfs_source not in gtfs:
            print(f"\n⚠️  No GTFS configured for source '{gtfs_source}'")
            continue

        print(f"\nGTFS source: {gtfs_source}")

        # detect calendar model
        with zipfile.ZipFile(gtfs[gtfs_source], "r") as zf:
            has_calendar = "calendar.txt" in zf.namelist()
            has_calendar_dates = "calendar_dates.txt" in zf.namelist()

        tables = load_gtfs_tables(
            gtfs[gtfs_source],
            ["stops", "stop_times", "trips"]
            + (["calendar"] if has_calendar else [])
            + (["calendar_dates"] if has_calendar_dates else [])
        )

        stops = tables["stops"]
        stop_times = tables["stop_times"]
        trips = tables["trips"]

        # compute service days
        if has_calendar:
            service_days = compute_trips_per_week(tables["calendar"])
        elif has_calendar_dates:
            service_days = compute_service_days_from_calendar_dates(
                tables["calendar_dates"],
                CAL_DATES_START,
                CAL_DATES_END
            )
        else:
            raise ValueError("No calendar or calendar_dates found")

        # attach service days to trips
        trips = trips.merge(service_days, on="service_id", how="left")
        trips["service_days_per_week"] = trips["service_days_per_week"].fillna(0)

        # attach trips to stop_times
        stop_times = stop_times.merge(
            trips[["trip_id", "service_days_per_week"]],
            on="trip_id",
            how="left"
        )

        stop_times = stop_times[stop_times["stop_id"].isin(stop_ids)]

        # weekly service count per stop
        weekly_counts = (
            stop_times.groupby("stop_id")["service_days_per_week"]
            .sum()
            .reset_index(name="services_per_week")
        )

        weekly_counts = weekly_counts.merge(
            stops[["stop_id", "stop_name"]],
            on="stop_id",
            how="left"
        )

        if weekly_counts.empty:
            print("  (no matching stops found)")
            continue

        # ---- per-stop output ----
        for _, row in weekly_counts.sort_values(
            "services_per_week", ascending=False
        ).iterrows():
            print(
                f"  - {row['stop_name']} "
                f"({row['stop_id']}): "
                f"{int(row['services_per_week'])} services/week"
            )

        # ---- summary ----
        total_stops = len(weekly_counts)
        total_services = int(weekly_counts["services_per_week"].sum())
        avg_services = int(total_services / total_stops)

        print("\n  Summary:")
        print(f"    Stops served: {total_stops}")
        print(f"    Total weekly services: {total_services}")
        print(f"    Average per stop: {avg_services}")


if __name__ == "__main__":
    main()