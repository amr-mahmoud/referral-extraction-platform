import { FieldDefinitionInput } from '../domain-types/extraction-schema.input';
import { ClinicId } from '../shared/ids/clinic-id.value-object';
import {
  ExtractionSchemaEmptyError,
  ExtractionSchemaValidationError,
} from './extraction-schema.errors';
import {
  FieldDefinition,
  InvalidFieldDefinitionError,
} from './field-definition.value-object';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ExtractionSchemaCreateProps {
  id?: string;
  clinicId: ClinicId;
  /** Explicit version. Mutually exclusive with `oldVersion`. */
  version?: number;
  /** Raw field inputs — the aggregate builds the `FieldDefinition` VOs itself. */
  schemaDefinition: FieldDefinitionInput[];
  createdAt?: Date;
  /** Version being superseded; the new schema lands at `oldVersion + 1`. */
  oldVersion?: number;
}

/**
 * A single, immutable version of a clinic's custom extraction schema.
 *
 * Revising a schema does not mutate this aggregate — construct a new one with
 * `oldVersion: previous.version` to get a fresh id at the next version. That
 * mirrors the `@@unique([clinicId, version])` one-row-per-version model in
 * `prisma/schema.prisma`.
 */
export class ExtractionSchema {
  id: string;
  clinicId: ClinicId;
  version: number;
  schemaDefinition: FieldDefinition[];
  createdAt: Date;

  public constructor({
    id,
    clinicId,
    version,
    schemaDefinition,
    createdAt,
    oldVersion,
  }: ExtractionSchemaCreateProps) {
    if (!clinicId) {
      throw new ExtractionSchemaValidationError('clinicId is required');
    }
    this.clinicId = clinicId;

    this.id = id ? this.validateIdFormat(id) : crypto.randomUUID();

    this.setSchemaDefinition(schemaDefinition);
    this.setValidVersion({ version, oldVersion });
    this.createdAt = createdAt ?? new Date();
  }

  private setValidVersion({
    version,
    oldVersion,
  }: {
    version?: number;
    oldVersion?: number;
  }): void {
    if (!version && !oldVersion) {
      throw new ExtractionSchemaValidationError(
        'Schema version must be a positive integer',
      );
    }

    if (version !== undefined) {
      if (!Number.isInteger(version) || version < 1) {
        throw new ExtractionSchemaValidationError(
          'Schema version must be a positive integer',
        );
      }
      this.version = version;
      return;
    }

    if (!Number.isInteger(oldVersion) || (oldVersion as number) < 1) {
      throw new ExtractionSchemaValidationError(
        'Schema version must be a positive integer',
      );
    }
    this.version = (oldVersion as number) + 1;
  }

  private validateIdFormat(id: string): string {
    if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      throw new ExtractionSchemaValidationError(
        `Invalid extraction schema id: '${String(id)}'`,
      );
    }
    return id;
  }

  /**
   * Validates raw field inputs and turns them into `FieldDefinition` VOs.
   *
   * Private on purpose: a schema version is immutable once built, so the only
   * legitimate caller is the constructor. Revisions go through `oldVersion`.
   */
  private setSchemaDefinition(schemaDefinition: FieldDefinitionInput[]): void {
    if (!Array.isArray(schemaDefinition) || schemaDefinition.length === 0) {
      throw new ExtractionSchemaEmptyError(
        'Extraction schema must contain at least one field definition',
      );
    }

    const seenKeys = new Set<string>();

    this.schemaDefinition = schemaDefinition.map((field, index) => {
      const rawName = field?.key ?? field?.label;

      if (typeof rawName !== 'string' || rawName.trim() === '') {
        throw new InvalidFieldDefinitionError(
          `Field at index ${index} must have a non-empty parameter name`,
        );
      }

      const key = this.toFieldKey(rawName);

      // Distinct names can slugify to the same key ("Policy Number" and
      // "policy-number" both become "policy_number"); reject rather than
      // letting one silently overwrite the other downstream.
      if (seenKeys.has(key)) {
        throw new ExtractionSchemaValidationError(
          `Duplicate field key '${key}' derived from '${rawName.trim()}'`,
        );
      }
      seenKeys.add(key);

      const label =
        typeof field.label === 'string' && field.label.trim() !== ''
          ? field.label.trim()
          : rawName.trim();

      // FieldDefinition enforces the non-empty-description invariant.
      return new FieldDefinition(key, label, field?.description);
    });
  }

  /** Slugifies a parameter name into a stable JSON property key. */
  private toFieldKey(rawName: string): string {
    return rawName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
  }
}
