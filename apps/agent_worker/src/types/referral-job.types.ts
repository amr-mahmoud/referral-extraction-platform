export interface CachedExtractionSchema {
  id: string;
  version: number;
  schemaDefinition: { key: string; label: string; description: string }[];
}

export interface ReferralJobContext {
  referralId: string;
  clinicId: string;
  bucket: string;
  key: string;
}

export type ReferralJobResult =
  | { kind: 'COMPLETED' }
  | { kind: 'REJECTED'; reason: string }
  | { kind: 'SKIPPED'; reason: string };
