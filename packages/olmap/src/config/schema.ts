export const CONFIG_SCHEMA_VERSION = 'legacy-1' as const;

export interface RouteConfig {
  hidden?: boolean;
}

export interface AgencyConfig {
  type: string;
  longName: string;
  shortName?: string;
  routes?: Record<string, RouteConfig>;
  filterFunction?: string;
}

export interface FeedConfig {
  gtfs: {
    url: string;
    annotatedUrl?: string;
  };
  agencies: Record<string, AgencyConfig>;
  hideStops?: boolean;
}

export interface FeedGroupConfig {
  name?: string;
  members: string[];
  hidden?: boolean;
}

export interface KmlGroupConfig {
  name: string;
}

export interface KmlGroups {
  hardcoded: Record<string, KmlGroupConfig>;
  generated: Record<string, KmlGroupConfig>;
}

export interface ConfigFile {
  schemaVersion: typeof CONFIG_SCHEMA_VERSION;
  dataVersion: string;
  feeds: Record<string, FeedConfig>;
  feedGroups: Record<string, FeedGroupConfig>;
  kmlGroups: KmlGroups;
}
