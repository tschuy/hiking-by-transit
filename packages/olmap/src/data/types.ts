export interface SourceMetadata {
  sourceId: string;
  sourceUrl?: string;
  attribution?: string;
  generatedAt?: string;
  version?: string;
  freshnessDate?: string;
}

export interface NormalizedFeatureProperties extends SourceMetadata {
  id: string;
  name: string;
  description?: string;
  [key: string]: string | number | boolean | null | undefined;
}
