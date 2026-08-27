import type { FieldDefinitionInput } from '../domain-types/extraction-schema.input';
import {
  ExtractionSchemaEmptyError,
  ExtractionSchemaValidationError,
} from './extraction-schema.errors';
import {
  FieldDefinition,
  InvalidFieldDefinitionError,
} from './field-definition.value-object';
import type { ExtractionSchemaCreateProps } from './types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ExtractionSchema {
  id: string;
  clinicId: string;
  version: number;
  title: string;
  schemaDefinition: FieldDefinition[];
  createdAt: Date;

  public constructor({
    id,
    clinicId,
    title,
    version,
    schemaDefinition,
    createdAt,
    oldVersion,
  }: ExtractionSchemaCreateProps) {
    if (!clinicId) {
      throw new ExtractionSchemaValidationError('clinicId is required');
    }
    this.clinicId = clinicId;

    this.id = id ? this.validateId(id) : this.generateId();

    this.setSchemaDefinition(schemaDefinition);
    this.setValidVersion({ version, oldVersion });
    this.title = this.resolveTitle(title, this.version);
    this.createdAt = createdAt ?? new Date();
  }

  /** Normalises the optional input into a non-empty, displayable title. */
  private resolveTitle(title: string | undefined, version: number): string {
    if (typeof title === 'string' && title.trim() !== '') {
      return title.trim();
    }
    return `Custom schema v${version}`;
  }
  public readonly generateId = (): string => crypto.randomUUID();

  /** Own-id validation: a schema id is a UUID, so a malformed id is caught here. */
  public readonly validateId = (id: string): string => {
    if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      throw new ExtractionSchemaValidationError(
        `Invalid extraction schema id: '${String(id)}'`,
      );
    }
    return id;
  };
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
