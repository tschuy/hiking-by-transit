#!/usr/bin/env python3

import argparse
import os
import sys
import tempfile
import urllib.request
import zipfile

from config import gtfs_map

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

    # Download to a temporary file first
    fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(dest_path))
    os.close(fd)

    try:
        with urllib.request.urlopen(req) as response, open(temp_path, "wb") as f:
            f.write(response.read())

        # If replacing an existing ZIP, verify the downloaded file is valid.
        if (
            os.path.exists(dest_path)
            and dest_path.lower().endswith(".zip")
        ):
            try:
                with zipfile.ZipFile(temp_path) as zf:
                    bad_file = zf.testzip()
                    if bad_file is not None:
                        raise zipfile.BadZipFile(
                            f"Corrupt member: {bad_file}"
                        )
            except Exception:
                os.remove(temp_path)
                raise RuntimeError(
                    f"Downloaded file for {dest_path} is not a valid ZIP; "
                    "keeping existing file."
                )

        # Atomically replace the destination.
        os.replace(temp_path, dest_path)

        print(f"Saved to {dest_path}")

    except Exception:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise


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