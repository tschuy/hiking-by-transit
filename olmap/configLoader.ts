export interface RouteConfig {
  hidden?: boolean;
}

export interface AgencyConfig {
  type: string;
  long_name: string;
  short_name?: string;
  routes?: Record<string, RouteConfig>;
  filter_function?: string;
}

export interface FeedConfig {
  gtfs: {
    url: string;
    annotated_url?: string;
  };
  agencies: Record<string, AgencyConfig>;
}

export interface FeedGroupConfig {
  members: string[];
  hidden?: boolean;
}

export interface KMLGroupConfig {
  name: string;
}

export interface KMLGroups {
  hardcoded: Record<string, KMLGroupConfig>;
  generated: Record<string, KMLGroupConfig>;
}

export interface ConfigFile {
  feeds: Record<string, FeedConfig>;
  feedGroups: Record<string, FeedGroupConfig>;
  kmlGroups: KMLGroups;
}

function camelize<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(camelize) as any;
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        camelize(v)
      ])
    ) as any;
  }
  return obj;
}

export async function fetchConfig(url: string): Promise<ConfigFile> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
  const json = await res.json();
  return camelize<ConfigFile>(json);
}
