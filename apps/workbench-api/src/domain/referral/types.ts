import type { ExtractedField } from './extracted-field.value-object';
import type { ReferralStatus } from './referral-status.value-object';

/** The lifecycle states a referral passes through. */
export enum ReferralStatusValue {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

/**
 * Input contract for constructing a `Referral` aggregate.
 * Kept separate from the aggregate so the class file holds only behaviour.
 */
export interface ReferralCreateProps {
  /** Self-generated when absent. Expected to be a UUID string. */
  id?: string;
  /** Owning clinic id (UUID string). */
  clinicId: string;
  /** Original uploaded file name; must end in `.pdf`. */
  fileName: string;
  /** Unknown until extraction resolves one — `null` is a legal, expected state. */
  patientName?: string | null;

  extractionSchemaId?: string | null;
  status?: ReferralStatus;
  extractedPayload?: ExtractedField[];
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
