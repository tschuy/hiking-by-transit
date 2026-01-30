import csv
import zipfile
from pathlib import Path

from constants import gtfs_map, agency_map


def prompt(field_name, current_value=None, default=None):
    """
    Prompt the user to keep or modify a field.
    Hitting Enter keeps the current/default value.
    """
    prompt_value = (
        current_value
        if current_value not in (None, "")
        else default
    )

    value = input(f"{field_name} [{prompt_value}]: ").strip()
    return value if value else prompt_value


def load_agencies_from_gtfs(gtfs_zip_path):
    """
    Read agency.txt from a GTFS zip.
    """
    agencies = []

    with zipfile.ZipFile(gtfs_zip_path, "r") as zf:
        if "agency.txt" not in zf.namelist():
            raise ValueError("agency.txt not found in GTFS zip")

        with zf.open("agency.txt") as f:
            reader = csv.DictReader(
                (line.decode("utf-8-sig") for line in f)
            )
            for row in reader:
                agencies.append(row)

    return agencies


def main():
    new_entries = {}

    for key, cfg in gtfs_map.items():
        url = cfg.get("url")
        path = Path(cfg.get("path"))

        if url in agency_map:
            continue

        if not path.exists():
            print(f"⚠️  GTFS file not found: {path}")
            continue

        print("\n" + "=" * 60)
        print(f"Processing GTFS: {key}")
        print(f"URL: {url}")
        print("=" * 60)

        try:
            agencies = load_agencies_from_gtfs(path)
        except Exception as e:
            print(f"Failed to read GTFS: {e}")
            continue

        url_entry = {}

        for agency in agencies:
            agency_id_raw = agency.get("agency_id")
            try:
                agency_id = int(agency_id_raw)
            except (TypeError, ValueError):
                agency_id = agency_id_raw

            print("\n--- Agency ---")
            print(f"agency_id: {agency_id}")

            long_name = prompt(
                "long_name",
                agency.get("agency_long_name")
                or agency.get("agency_name")
            )

            short_name = prompt(
                "short_name",
                current_value=agency.get("agency_short_name"),
                default=""
            )

            if short_name == "":
                short_name = None

            agency_type = prompt(
                "type",
                default="bus"
            )

            entry = {"type": agency_type}

            if long_name:
                entry["long_name"] = long_name
            if short_name:
                entry["short_name"] = short_name

            url_entry[agency_id] = entry

        if url_entry:
            new_entries[url] = url_entry

    if not new_entries:
        print("\nNo new agency_map entries needed.")
        return

    print("\n" + "=" * 60)
    print("New entries to add to agency_map:")
    print("=" * 60)

    for url, agencies in new_entries.items():
        print(f'\n"{url}": {{')
        for agency_id, data in agencies.items():
            print(f"    {repr(agency_id)}: {data},")
        print("},")


if __name__ == "__main__":
    main()