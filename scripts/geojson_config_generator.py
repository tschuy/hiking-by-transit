import sys
import json
import yaml
from pathlib import Path

CONFIG_YML = Path("../data/config.yml")

if len(sys.argv) != 3:
    print("Usage: python build_geojson_config.py <true|false> <output_file.json>")
    sys.exit(1)

hide_stops_value = sys.argv[1].lower()
output_file = Path(sys.argv[2])

if hide_stops_value not in {"true", "false"}:
    print("First argument must be 'true' or 'false'")
    sys.exit(1)

hide_stops = hide_stops_value == "true"

with CONFIG_YML.open() as f:
    config = yaml.safe_load(f)

agencies = [
    {
        "agencyKey": key,
        "path": f"../data/gtfs/{key}.zip",
    }
    for key, feed in config.get("feeds", {}).items()
    if feed.get("hideStops") is hide_stops
]

tmp_config = {
    "agencies": agencies,
    "outputType": "agency",
    "outputFormat": "lines" if hide_stops else "lines-and-stops",
    "outputPath": "../jekyll/assets/geojson",
    "ignoreDuplicates": True,
}

with output_file.open("w") as f:
    json.dump(tmp_config, f, indent=4)

print(f"Wrote {output_file}")
