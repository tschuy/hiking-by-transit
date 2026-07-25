import type { SourceMetadata } from './types';

function firstString(properties: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

export function normalizeSourceProperties(
  properties: Record<string, unknown>,
  metadata: SourceMetadata,
): Record<string, unknown> {
  return {
    ...properties,
    name: firstString(properties, ['name', 'stop_name', 'route_short_name', 'route_long_name', 'title']) ?? metadata.sourceId,
    description: firstString(properties, ['description', 'desc', 'blurb']),
    source_id: metadata.sourceId,
    source_url: firstString(properties, ['source_url', 'official_url']) ?? metadata.sourceUrl,
    source_attribution: metadata.attribution,
    data_version: metadata.version,
    generated_at: metadata.generatedAt,
    freshness_date: metadata.freshnessDate,
  };
}
