#!/usr/bin/env python3

import argparse
import pandas as pd
import zipfile
import os

GTFS_ID_COLUMNS = ["stop_id", "trip_id", "route_id", "service_id"]

def load_gtfs(gtfs_path):
    """Load GTFS CSV files from a zip or folder into pandas DataFrames."""
    data = {}

    def read_csv(path_or_buf):
        return pd.read_csv(
            path_or_buf,
            dtype={c: str for c in GTFS_ID_COLUMNS},
            skipinitialspace=True,  # handles " 1" in calendar.txt
        )

    if gtfs_path.endswith(".zip"):
        with zipfile.ZipFile(gtfs_path, 'r') as z:
            for filename in z.namelist():
                if filename.endswith(".txt"):
                    df_name = os.path.splitext(os.path.basename(filename))[0]
                    data[df_name] = read_csv(z.open(filename))
    else:
        for filename in os.listdir(gtfs_path):
            if filename.endswith(".txt"):
                df_name = os.path.splitext(filename)[0]
                data[df_name] = read_csv(os.path.join(gtfs_path, filename))

    # Normalize GTFS ID columns
    for df in data.values():
        for col in GTFS_ID_COLUMNS:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()

    return data

def get_stop_summary(stop_id, gtfs_path):
    """
    Returns a dictionary with information about a stop:
    - stop_ids: all stop_ids with the same stop_name
    - stop_name: the stop's name
    - stop_lon: longitude of the stop (from the first matching stop ID)
    - stop_lat: latitude of the stop (from the first matching stop ID)
    - weekday_counts: average number of stops per weekday (Mon-Fri)
    - saturday_counts: average number of stops on Saturday
    - sunday_counts: average number of stops on Sunday
    - route_ids: list of route_ids serving this stop
    """

    gtfs = load_gtfs(gtfs_path)

    required_files = ["stops", "stop_times", "trips", "routes"]
    for f in required_files:
        if f not in gtfs:
            raise ValueError(f"{f}.txt is missing from GTFS")

    if "calendar" not in gtfs and "calendar_dates" not in gtfs:
        raise ValueError("GTFS must contain calendar.txt or calendar_dates.txt")


    stops = gtfs["stops"]
    stop_times = gtfs["stop_times"]
    trips = gtfs["trips"]
    routes = gtfs["routes"]
    calendar = gtfs.get("calendar")
    calendar_dates = gtfs.get("calendar_dates")

    stop_row = stops[stops["stop_id"] == stop_id]
    if stop_row.empty:
        raise ValueError(f"Stop ID {stop_id} not found in stops.txt")

    stop_name = stop_row.iloc[0]["stop_name"]

    # All stop_ids sharing this name
    stop_ids_same_name = stops[stops["stop_name"] == stop_name]["stop_id"].tolist()

    first_stop = stops[stops["stop_name"] == stop_name].iloc[0]
    stop_lon = first_stop["stop_lon"]
    stop_lat = first_stop["stop_lat"]

    weekday_counts_list = []
    saturday_counts_list = []
    sunday_counts_list = []

    for sid in stop_ids_same_name:
        stimes = stop_times[stop_times["stop_id"] == sid]
        trips_joined = stimes.merge(trips, on="trip_id", how="left")

        if calendar is not None:
            cal_joined = trips_joined.merge(calendar, on="service_id", how="left")

            weekday_counts_list.append(
                cal_joined[["monday","tuesday","wednesday","thursday","friday"]]
                .sum(axis=1).sum() / 5
            )
            saturday_counts_list.append(cal_joined["saturday"].sum())
            sunday_counts_list.append(cal_joined["sunday"].sum())

        else:
            svc = trips_joined.merge(calendar_dates, on="service_id", how="left")
            svc = svc[svc["exception_type"] == 1]
            svc["date"] = pd.to_datetime(svc["date"], format="%Y%m%d", errors="coerce")

            weekday = svc[svc["date"].dt.weekday < 5]
            saturday = svc[svc["date"].dt.weekday == 5]
            sunday = svc[svc["date"].dt.weekday == 6]

            weekday_counts_list.append(len(weekday) / 5)
            saturday_counts_list.append(len(saturday))
            sunday_counts_list.append(len(sunday))

    # Average across stop_ids
    weekday_counts = sum(weekday_counts_list) if weekday_counts_list else 0
    saturday_counts = sum(saturday_counts_list) if saturday_counts_list else 0
    sunday_counts = sum(sunday_counts_list) if sunday_counts_list else 0

    # Routes serving any of these stop_ids
    stimes_all = stop_times[stop_times["stop_id"].isin(stop_ids_same_name)]
    trips_all = stimes_all.merge(trips, on="trip_id", how="left")
    trips_all["route_id"] = trips_all["route_id"].astype(str).str.strip()

    route_ids = sorted(trips_all["route_id"].unique().tolist())

    return {
        "stop_ids": stop_ids_same_name,
        "stop_name": stop_name,
        "stop_lon": stop_lon,
        "stop_lat": stop_lat,
        "weekday_counts": weekday_counts,
        "saturday_counts": saturday_counts,
        "sunday_counts": sunday_counts,
        "route_ids": route_ids
    }

def main():
    parser = argparse.ArgumentParser(description="GTFS Stop Summary")
    parser.add_argument("gtfs", help="Path to GTFS zip or folder")
    parser.add_argument("stop_id", help="Stop ID to analyze")
    args = parser.parse_args()

    summary = get_stop_summary(args.stop_id, args.gtfs)

    print(f"Summary for stop {summary['stop_name']} (Stop IDs: {', '.join(summary['stop_ids'])})")
    print(f"Coordinates: lon={summary['stop_lon']}, lat={summary['stop_lat']}")

    print(f"Stop ID: {args.stop_id}")
    print(f"Stop name: {summary['stop_name']}")

    print("\nAverage number of stops per day:")
    print(f"  Weekdays: {summary['weekday_counts']:.1f}")
    print(f"  Saturday: {summary['saturday_counts']:.1f}")
    print(f"  Sunday:   {summary['sunday_counts']:.1f}")

    print("\nRoutes serving this stop:")
    print(",".join(summary['route_ids']))

    print("\nStop lon,lat:")
    print(f'{summary["stop_lon"]},{summary["stop_lat"]}')

if __name__ == "__main__":
    main()
