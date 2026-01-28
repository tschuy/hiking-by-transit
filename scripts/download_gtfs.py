#!/usr/bin/env python3

import argparse
import os
import sys
import urllib.request

from constants import gtfs_map

# seriously, Yolo?
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

def download_file(url: str, dest_path: str):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT},
    )

    print(f"Downloading {url}")
    with urllib.request.urlopen(req) as response, open(dest_path, "wb") as f:
        f.write(response.read())

    print(f"Saved to {dest_path}")


def main():
    parser = argparse.ArgumentParser(description="Download GTFS files")
    parser.add_argument(
        "--mtc-api-key",
        required=True,
        help="required for MTC's Regional Bay Area GTFS feed",
    )
    args = parser.parse_args()

    for name, info in gtfs_map.items():
        url_template = info.get("annotated_url", info["url"])
        dest_path = info["path"]

        url = url_template.format(mtc_api_key=args.mtc_api_key)

        try:
            download_file(url, dest_path)
        except Exception as e:
            print(f"Failed to download {name}: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()