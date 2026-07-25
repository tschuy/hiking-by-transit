# TypeScript baseline

Recorded against the unchanged imported source with TypeScript 5.9.3 and the
package's locked OpenLayers dependency.

At the end of Phase 0, `npm run typecheck` failed. The diagnostics fell into
these stable categories:

- OpenLayers `VectorLayer` / `VectorSource` generic parameters are used as source
  types rather than feature types (`main.ts` around lines 104, 173, 216, 221,
  233, and 407).
- Custom layer properties such as `name` are rejected as a consequence of those
  incorrect generic types.
- The template global `hikes_with_gpx` is undeclared (around line 233).
- Feature geometry and pixel values are accessed without sufficient narrowing
  (around lines 239, 297, 320, 392, and 414).
- The code mutates a non-public KML option (`showPointNames`, around line 420).
- Camelized `shortName` and `longName` are absent from the snake_case
  `AgencyConfig` interface (around lines 354–355).
- Popup helper values acquire properties that are absent from their inferred
  return type (around lines 438–439).

Phase 1 resolved this baseline: `npm run typecheck` now passes. The record above
is retained to distinguish imported defects from later regressions.
