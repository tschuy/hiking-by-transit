import type { ConfigFile } from './schema';
import { validateConfig } from './validate';

export async function fetchConfig(url: string, signal?: AbortSignal): Promise<ConfigFile> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Failed to fetch config from ${url}: ${response.status}`);
  return validateConfig(await response.json());
}

export type {
  AgencyConfig,
  ConfigFile,
  FeedConfig,
  FeedGroupConfig,
  KmlGroupConfig,
  KmlGroups,
  RouteConfig,
} from './schema';
