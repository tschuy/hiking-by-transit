"""Parse canonical trailhead names into destinations and entrance labels."""

from __future__ import annotations

import re
from dataclasses import dataclass


DESTINATION_DESIGNATIONS = re.compile(
    r"(?:park|preserve|open space|forest|wilderness|recreation area|regional shoreline|"
    r"state beach|national monument|national scenic area|historic site|historic farm|"
    r"ecological reserve|wildlife area|wildlife refuge|natural reserve|natural preserve|"
    r"state reserve|state historic park|state recreation area|state natural reserve)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ParsedTrailheadName:
    destination_names: tuple[str, ...]
    entrance_name: str | None


def _split_destinations(value: str) -> tuple[str, ...]:
    parts = tuple(part.strip() for part in value.split(" / "))
    if any(not part for part in parts):
        raise ValueError(f"Invalid empty destination in canonical trailhead name: {value}")
    return parts


def destination_candidates(names: list[str]) -> set[str]:
    """Collect destination names made explicit by a colon or spaced slash."""
    candidates: set[str] = set()
    for raw_name in names:
        name = " ".join(raw_name.split())
        destination_part, separator, _ = name.partition(":")
        if separator or " / " in destination_part:
            candidates.update(_split_destinations(destination_part))
    return candidates


def parse_trailhead_name(name: str, known_destination_names: set[str] | None = None) -> ParsedTrailheadName:
    canonical_name = " ".join(name.split())
    if not canonical_name:
        raise ValueError("Canonical trailhead name cannot be empty")

    destination_part, separator, entrance_part = canonical_name.partition(":")
    entrance_name = entrance_part.strip() if separator else None
    if separator and not entrance_name:
        raise ValueError(f"Canonical trailhead name has an empty entrance: {canonical_name}")

    known = {value.casefold() for value in known_destination_names or set()}
    is_explicit_destination = bool(separator or " / " in destination_part)
    is_standalone_destination = bool(DESTINATION_DESIGNATIONS.search(destination_part) or destination_part.casefold() in known)
    destinations = _split_destinations(destination_part) if is_explicit_destination or is_standalone_destination else ()
    return ParsedTrailheadName(destinations, entrance_name)
