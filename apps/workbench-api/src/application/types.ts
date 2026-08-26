import type { FieldDefinitionInput } from '../domain/domain-types/extraction-schema.input';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import { Referral } from '../domain/referral/referral.aggregate';
import { ExtractedField } from '../domain/referral/extracted-field.value-object';
import type { PresignedUrl } from './ports/storage.port';

// ── Auth Commands & Results ──────────────────────────────────────────

export interface SignupCommand {
  clinicName: string;
  username: string;
  password: string;
}

export interface LoginCommand {
  username: string;
  password: string;
}

export interface AuthResult {
  clinic: Clinic;
  token: string;
}

// ── Extraction Schema Commands ───────────────────────────────────────

export interface CreateExtractionSchemaCommand {
  clinicId: string;
  /** Optional version name; the aggregate falls back to `Custom schema v{n}`. */
  title?: string;
  /** Already normalised by the interface layer; see `normalizeExtractionSchemaFields`. */
  fields: FieldDefinitionInput[];
}

// ── Referral Commands & Queries ──────────────────────────────────────

export interface CreateReferralItemCommand {
  fileName: string;
  patientName?: string | null;
}

export interface CreateNewReferralsWithAttachedPresignedUrlsCommand {
  clinicId: string;
  files: CreateReferralItemCommand[];
  /** Shared across the whole batch. Falls back to the clinic's default, then `null`. */
  extractionSchemaId?: string | null;
}

export interface ReferralWithPresignedUpload {
  referral: Referral;
  upload: PresignedUrl;
}

export interface ListReferralsQuery {
  clinicId: string;
  page: number;
  limit: number;
}

export interface CorrectReferralCommand {
  clinicId: string;
  referralId: string;
  extractedPayload: ExtractedField[];
}
