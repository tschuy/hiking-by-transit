import type { DataSourceLoadResult, MapDataSource, SourceLoadProgress } from '../core/types';
import type { SourceMetadata } from './types';

interface CachedSource {
  data: unknown;
  metadata: SourceMetadata;
}

const memoryCache = new Map<string, CachedSource>();

export class DataSourceUnavailableError extends Error {
  constructor(public readonly sourceId: string, reason: string) {
    super(`Data source ${sourceId} is unavailable: ${reason}`);
    this.name = 'DataSourceUnavailableError';
  }
}

function isLoadResult(value: unknown): value is DataSourceLoadResult {
  return typeof value === 'object' && value !== null && 'data' in value;
}

function cacheKey(source: MapDataSource): string | undefined {
  if (source.cachePolicy === 'none') return undefined;
  const versionKey = source.cacheKey ?? (source.version && (source.url ?? source.id));
  return versionKey ? `${versionKey}@${source.version ?? 'unversioned'}` : undefined;
}

function metadataFor(source: MapDataSource, overrides?: Partial<SourceMetadata>): SourceMetadata {
  return {
    sourceUrl: source.sourceUrl ?? source.url,
    attribution: source.attribution,
    generatedAt: source.generatedAt,
    version: source.version,
    freshnessDate: source.freshnessDate,
    ...overrides,
    sourceId: source.id,
  };
}

async function readResponse(
  response: Response,
  source: MapDataSource,
  reportProgress: (progress: SourceLoadProgress) => void,
): Promise<unknown> {
  const totalHeader = response.headers.get('content-length');
  const totalBytes = totalHeader ? Number(totalHeader) : undefined;
  if (!response.body) return source.kind === 'geojson' ? response.json() : response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loadedBytes += value.byteLength;
    reportProgress({
      phase: 'fetching',
      loadedBytes,
      totalBytes,
      fraction: totalBytes && totalBytes > 0 ? Math.min(loadedBytes / totalBytes, 1) : undefined,
    });
  }
  const bytes = new Uint8Array(loadedBytes);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  const text = new TextDecoder().decode(bytes);
  return source.kind === 'geojson' ? JSON.parse(text) : text;
}

export async function loadDataSource(
  source: MapDataSource,
  signal: AbortSignal,
  reportProgress: (progress: SourceLoadProgress) => void = () => undefined,
  bypassCache = false,
): Promise<CachedSource> {
  if (source.unavailableReason) throw new DataSourceUnavailableError(source.id, source.unavailableReason);
  const key = cacheKey(source);
  if (!bypassCache && key) {
    const cached = memoryCache.get(key);
    if (cached) {
      reportProgress({ phase: 'complete', fraction: 1 });
      return cached;
    }
  }

  signal.throwIfAborted();
  reportProgress({ phase: 'queued', fraction: 0 });
  let loaded: unknown;
  if (source.load) {
    loaded = await source.load(signal, reportProgress);
  } else {
    if (!source.url) throw new Error(`Data source ${source.id} has no URL or loader`);
    reportProgress({ phase: 'fetching', loadedBytes: 0, fraction: 0 });
    const response = await fetch(source.url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${source.url}`);
    loaded = await readResponse(response, source, reportProgress);
  }
  signal.throwIfAborted();
  reportProgress({ phase: 'parsing', fraction: 0.95 });
  const result = isLoadResult(loaded) ? loaded : { data: loaded };
  const resolved = { data: result.data, metadata: metadataFor(source, result.metadata) };
  if (key) memoryCache.set(key, resolved);
  reportProgress({ phase: 'complete', fraction: 1 });
  return resolved;
}

export function clearDataSourceCache(source?: Pick<MapDataSource, 'id' | 'url' | 'version' | 'cacheKey' | 'cachePolicy'>): void {
  if (!source) {
    memoryCache.clear();
    return;
  }
  const key = cacheKey(source as MapDataSource);
  if (key) memoryCache.delete(key);
}

export function getDataSourceCacheSize(): number {
  return memoryCache.size;
}
