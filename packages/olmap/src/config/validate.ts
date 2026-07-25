import {
  CONFIG_SCHEMA_VERSION,
  type AgencyConfig,
  type ConfigFile,
  type FeedConfig,
  type FeedGroupConfig,
  type KmlGroupConfig,
  type RouteConfig,
} from './schema';

export interface ConfigValidationIssue {
  path: string;
  message: string;
}

export class ConfigValidationError extends Error {
  readonly issues: ConfigValidationIssue[];

  constructor(issues: ConfigValidationIssue[]) {
    super(`Invalid olmap configuration:\n${issues.map(({ path, message }) => `- ${path}: ${message}`).join('\n')}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, path: string, issues: ConfigValidationIssue[]): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({ path: `${path}.${key}`, message: 'must be a non-empty string' });
    return '';
  }
  return value;
}

function optionalBoolean(record: Record<string, unknown>, key: string, path: string, issues: ConfigValidationIssue[]): boolean | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    issues.push({ path: `${path}.${key}`, message: 'must be boolean' });
    return undefined;
  }
  return value;
}

function parseRoutes(value: unknown, path: string, issues: ConfigValidationIssue[]): Record<string, RouteConfig> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return undefined;
  }
  return Object.fromEntries(Object.entries(value).map(([routeId, route]) => {
    if (!isRecord(route)) {
      issues.push({ path: `${path}.${routeId}`, message: 'must be an object' });
      return [routeId, {}];
    }
    return [routeId, { hidden: optionalBoolean(route, 'hidden', `${path}.${routeId}`, issues) }];
  }));
}

function parseAgencies(value: unknown, path: string, issues: ConfigValidationIssue[]): Record<string, AgencyConfig> {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([agencyId, agency]) => {
    const agencyPath = `${path}.${agencyId}`;
    if (!isRecord(agency)) {
      issues.push({ path: agencyPath, message: 'must be an object' });
      return [agencyId, { type: '', longName: '' }];
    }
    const parsed: AgencyConfig = {
      type: readString(agency, 'type', agencyPath, issues),
      longName: readString(agency, 'long_name', agencyPath, issues),
    };
    if (typeof agency.short_name === 'string') parsed.shortName = agency.short_name;
    else if (agency.short_name !== undefined) issues.push({ path: `${agencyPath}.short_name`, message: 'must be a string' });
    if (typeof agency.filter_function === 'string') parsed.filterFunction = agency.filter_function;
    else if (agency.filter_function !== undefined) issues.push({ path: `${agencyPath}.filter_function`, message: 'must be a string' });
    const routes = parseRoutes(agency.routes, `${agencyPath}.routes`, issues);
    if (routes) parsed.routes = routes;
    return [agencyId, parsed];
  }));
}

function parseFeeds(value: unknown, issues: ConfigValidationIssue[]): Record<string, FeedConfig> {
  if (!isRecord(value)) {
    issues.push({ path: 'feeds', message: 'must be an object' });
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([feedId, feed]) => {
    const feedPath = `feeds.${feedId}`;
    if (!isRecord(feed)) {
      issues.push({ path: feedPath, message: 'must be an object' });
      return [feedId, { gtfs: { url: '' }, agencies: {} }];
    }
    const gtfs = isRecord(feed.gtfs) ? feed.gtfs : {};
    if (!isRecord(feed.gtfs)) issues.push({ path: `${feedPath}.gtfs`, message: 'must be an object' });
    const parsed: FeedConfig = {
      gtfs: { url: readString(gtfs, 'url', `${feedPath}.gtfs`, issues) },
      agencies: parseAgencies(feed.agencies, `${feedPath}.agencies`, issues),
    };
    if (typeof gtfs.annotated_url === 'string') parsed.gtfs.annotatedUrl = gtfs.annotated_url;
    else if (gtfs.annotated_url !== undefined) issues.push({ path: `${feedPath}.gtfs.annotated_url`, message: 'must be a string' });
    const hideStops = optionalBoolean(feed, 'hideStops', feedPath, issues);
    if (hideStops !== undefined) parsed.hideStops = hideStops;
    return [feedId, parsed];
  }));
}

function parseFeedGroups(value: unknown, feedIds: Set<string>, issues: ConfigValidationIssue[]): Record<string, FeedGroupConfig> {
  if (!isRecord(value)) {
    issues.push({ path: 'feed_groups', message: 'must be an object' });
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([groupId, group]) => {
    const groupPath = `feed_groups.${groupId}`;
    if (!isRecord(group)) {
      issues.push({ path: groupPath, message: 'must be an object' });
      return [groupId, { members: [] }];
    }
    const members = Array.isArray(group.members) && group.members.every((member) => typeof member === 'string')
      ? group.members
      : [];
    if (members.length !== (Array.isArray(group.members) ? group.members.length : -1)) {
      issues.push({ path: `${groupPath}.members`, message: 'must be an array of strings' });
    }
    members.forEach((feedId) => {
      if (!feedIds.has(feedId)) issues.push({ path: `${groupPath}.members`, message: `references unknown feed "${feedId}"` });
    });
    const parsed: FeedGroupConfig = { members };
    if (typeof group.name === 'string') parsed.name = group.name;
    const hidden = optionalBoolean(group, 'hidden', groupPath, issues);
    if (hidden !== undefined) parsed.hidden = hidden;
    return [groupId, parsed];
  }));
}

function parseKmlGroup(value: unknown, path: string, issues: ConfigValidationIssue[]): Record<string, KmlGroupConfig> {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([layerId, layer]) => {
    const layerPath = `${path}.${layerId}`;
    if (!isRecord(layer)) {
      issues.push({ path: layerPath, message: 'must be an object' });
      return [layerId, { name: '' }];
    }
    return [layerId, { name: readString(layer, 'name', layerPath, issues) }];
  }));
}

export function validateConfig(value: unknown): ConfigFile {
  const issues: ConfigValidationIssue[] = [];
  if (!isRecord(value)) throw new ConfigValidationError([{ path: '$', message: 'must be an object' }]);

  const schemaVersion = value.schema_version;
  if (schemaVersion !== CONFIG_SCHEMA_VERSION) {
    issues.push({ path: 'schema_version', message: `must equal "${CONFIG_SCHEMA_VERSION}"` });
  }
  const dataVersion = readString(value, 'data_version', '$', issues);
  const feeds = parseFeeds(value.feeds, issues);
  const feedGroups = parseFeedGroups(value.feed_groups, new Set(Object.keys(feeds)), issues);
  const kmlGroupsRecord = isRecord(value.kml_groups) ? value.kml_groups : {};
  if (!isRecord(value.kml_groups)) issues.push({ path: 'kml_groups', message: 'must be an object' });
  const kmlGroups = {
    hardcoded: parseKmlGroup(kmlGroupsRecord.hardcoded, 'kml_groups.hardcoded', issues),
    generated: parseKmlGroup(kmlGroupsRecord.generated, 'kml_groups.generated', issues),
  };

  if (issues.length) throw new ConfigValidationError(issues);
  return { schemaVersion: CONFIG_SCHEMA_VERSION, dataVersion, feeds, feedGroups, kmlGroups };
}
