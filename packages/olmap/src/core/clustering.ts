export interface ClusterIdentityInput {
  sourceId: string;
  memberIds: Iterable<string>;
}

export function sortedClusterMemberIds(memberIds: Iterable<string>): string[] {
  return [...new Set(memberIds)].sort((left, right) => left.localeCompare(right));
}

export function createClusterId({ sourceId, memberIds }: ClusterIdentityInput): string {
  return `${sourceId}:cluster:${sortedClusterMemberIds(memberIds).join('|')}`;
}
