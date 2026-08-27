import type { ExtractionSchema } from '../extraction-schema/extraction-schema.aggregate';
import type { PasswordHash } from './password-hash.value-object';

/**
 * Input contract for constructing a `Clinic` aggregate.
 *
 * Kept separate from the aggregate so the class file holds only behaviour;
 * `CachedClinic` (application layer) derives its cached projection from this
 * type via `Omit` so shared fields cannot drift.
 */
export interface ClinicInputProps {
  /** Self-generated when absent. Expected to be a UUID string. */
  id?: string;
  clinicName: string;
  username: string;
  passwordHash?: PasswordHash | string;
  rawPassword?: string;
  hashedPassword?: string;
  /** The clinic's default extraction schema id, or `null` for the LLM default. */
  defaultExtractionSchemaId?: string | null;
  /** The clinic's related extraction schemas (cache/read hydration). */
  extractionSchemas?: ExtractionSchema[];
  createdAt?: Date;
  updatedAt?: Date;
}
