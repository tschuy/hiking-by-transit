#!/usr/bin/env python3
"""Generate the frontend content catalog from Markdown source files."""

import argparse
import json
import re
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]


def read_collection(name: str) -> list[dict]:
    records = []
    for path in sorted((ROOT / "content" / name).glob("*.md")):
        _, frontmatter, body = path.read_text(encoding="utf-8").split("---", 2)
        record = yaml.safe_load(frontmatter)
        if name == "posts":
            match = re.match(r"(\d{4})-(\d{2})-(\d{2})-(.+)", path.stem)
            if not match:
                raise ValueError(f"Post filename must start with YYYY-MM-DD: {path.name}")
            year, month, day, slug = match.groups()
            record.update({"slug": slug, "date": f"{year}-{month}-{day}", "url": f"/{year}/{month}/{day}/{slug}/"})
            body = body.replace("<!-- excerpt -->", "")
            def shared_media(match: re.Match) -> str:
                image, gpx = match.groups()
                return f"\n\n[[gpx-pair:{image}|{gpx}]]\n\n" if image else f"\n\n[[gpx:{gpx}]]\n\n"

            body = re.sub(
                r'<div class="shared-container">\s*(?:<div class="half"><img src="([^"]+)"></div>\s*)?<div class="map(?: half)?" data-gpx="([^"]+)"></div>\s*</div>',
                shared_media,
                body,
            )
            body = re.sub(r'<div class="map(?: half)?" data-gpx="([^"]+)"></div>', r'\n\n[[gpx:\1]]\n\n', body)
            body = re.sub(r'<p><iframe[^>]+src="https://www\.youtube\.com/embed/([^"]+)"[^>]*></iframe></p>', r'\n\n[[youtube:\1]]\n\n', body)
            body = body.replace('<div class="shared-container">', '').replace('</div>', '')
        if name == "events":
            match = re.match(r"(\d{4})-(\d{2})-(\d{2})-(.+)", path.stem)
            if not match:
                raise ValueError(f"Event filename must start with YYYY-MM-DD: {path.name}")
            year, month, day, slug = match.groups()
            record.update({"slug": slug, "published_date": f"{year}-{month}-{day}", "url": f"/events/{path.stem}/"})
        if name == "pages":
            body = re.sub(r'</?p(?: class="message")?>', '', body)
            body = body.replace('<b>', '**').replace('</b>', '**').replace('<hr>', '---')
        if name == "guides" and record.get("guide_id") == "samcoast":
            body = re.sub(r'<div id="filter">[\s\S]*?(?=!\[Año Nuevo)', '', body)
        record["body"] = body.strip()
        records.append(record)
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if the committed catalog is stale without writing it")
    args = parser.parse_args()
    catalog = {
        "hikes": read_collection("hikes"),
        "places": read_collection("places"),
        "posts": read_collection("posts"),
        "guides": read_collection("guides"),
        "events": read_collection("events"),
        "pages": read_collection("pages"),
    }
    output = ROOT / "src" / "data" / "content.generated.json"
    serialized = json.dumps(catalog, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != serialized:
            raise SystemExit("Generated content is stale; run `npm run generate` and commit the result.")
        print("Verified generated content catalog.")
        return
    output.write_text(serialized, encoding="utf-8")
    print(f"Generated {output.relative_to(ROOT)} with {len(catalog['hikes'])} hikes, {len(catalog['places'])} places, {len(catalog['posts'])} posts, {len(catalog['guides'])} guides, {len(catalog['events'])} events, and {len(catalog['pages'])} pages")


if __name__ == "__main__":
    main()
