import { Clinic, InvalidClinicIdError } from './clinic.aggregate';
import { ExtractionSchema } from '../extraction-schema/extraction-schema.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicInvalidUsernameFormatError,
  ClinicValidationError,
  ClinicWeakPasswordError,
} from './clinic.errors';
import { PasswordHash } from './password-hash.value-object';
import type { PasswordVerifier } from './password-verifier.type';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASHED_PASSWORD = 'hashed-password';
const SCHEMA_ID = '22222222-2222-4222-8222-222222222222';

function buildSchema(id = SCHEMA_ID): ExtractionSchema {
  return new ExtractionSchema({
    id,
    clinicId: 'clinic-1',
    version: 1,
    schemaDefinition: [
      { key: 'patient_name', label: 'Patient Name', description: 'Full name' },
    ],
  });
}

function buildClinic(
  overrides?: Partial<ConstructorParameters<typeof Clinic>[0]>,
): Clinic {
  return new Clinic({
    clinicName: 'Test Clinic',
    username: 'test_clinic',
    hashedPassword: HASHED_PASSWORD,
    ...overrides,
  });
}

describe('Clinic', () => {
  describe('construction', () => {
    it('creates a valid clinic with a generated id, hashed password, and defaults', () => {
      const clinic = buildClinic();

      expect(clinic.id).toMatch(UUID_REGEX);
      expect(clinic.clinicName).toBe('Test Clinic');
      expect(clinic.username).toBe('test_clinic');
      expect(clinic.passwordHash.value).toBe(HASHED_PASSWORD);
      expect(clinic.defaultExtractionSchemaId).toBeNull();
      expect(clinic.extractionSchemas).toEqual([]);
      expect(clinic.createdAt).toBeInstanceOf(Date);
      expect(clinic.updatedAt).toBeInstanceOf(Date);
    });

    it('uses a provided id, trimmed', () => {
      const clinic = buildClinic({ id: '  clinic-42  ' });
      expect(clinic.id).toBe('clinic-42');
    });

    it('rejects an empty id', () => {
      expect(() => buildClinic({ id: '   ' })).toThrow(InvalidClinicIdError);
    });

    it('requires a non-empty clinic name', () => {
      expect(() => buildClinic({ clinicName: '   ' })).toThrow(
        ClinicValidationError,
      );
    });

    it('requires a non-empty username', () => {
      expect(() => buildClinic({ username: '' })).toThrow(
        ClinicValidationError,
      );
    });

    it('rejects a username that does not match the allowed pattern', () => {
      expect(() => buildClinic({ username: 'has space' })).toThrow(
        ClinicInvalidUsernameFormatError,
      );
    });

    it('rejects a raw password shorter than the minimum length', () => {
      expect(() =>
        buildClinic({ rawPassword: 'short', hashedPassword: undefined }),
      ).toThrow(ClinicWeakPasswordError);
    });

    it('rejects construction without any password source', () => {
      expect(() =>
        buildClinic({ rawPassword: undefined, hashedPassword: undefined }),
      ).toThrow(ClinicValidationError);
    });

    it('hydrates the default extraction schema id and relations when provided', () => {
      const schema = buildSchema();
      const clinic = buildClinic({
        defaultExtractionSchemaId: SCHEMA_ID,
        extractionSchemas: [schema],
      });

      expect(clinic.defaultExtractionSchemaId).toBe(SCHEMA_ID);
      expect(clinic.extractionSchemas).toEqual([schema]);
    });
  });

  describe('id helpers', () => {
    it('generates a UUID id', () => {
      expect(buildClinic().generateId()).toMatch(UUID_REGEX);
    });

    it('validates and trims a non-empty id', () => {
      expect(buildClinic().validateId('  clinic-1  ')).toBe('clinic-1');
    });

    it('rejects a blank id', () => {
      const clinic = buildClinic();
      expect(() => clinic.validateId('   ')).toThrow(InvalidClinicIdError);
      expect(() => clinic.validateId('')).toThrow(InvalidClinicIdError);
    });
  });

  describe('verifyPassword', () => {
    const accepts: PasswordVerifier = () => Promise.resolve(true);
    const rejects: PasswordVerifier = () => Promise.resolve(false);
    const throws: PasswordVerifier = () =>
      Promise.reject(new Error('verifier exploded'));

    it('resolves when the verifier accepts the password', async () => {
      await expect(
        buildClinic().verifyPassword('password', accepts),
      ).resolves.toBeUndefined();
    });

    it('throws ClinicInvalidCredentialsError when the password does not match', async () => {
      await expect(
        buildClinic().verifyPassword('wrong', rejects),
      ).rejects.toBeInstanceOf(ClinicInvalidCredentialsError);
    });

    it('wraps an unexpected verifier failure into ClinicInvalidCredentialsError (fail-closed)', async () => {
      await expect(
        buildClinic().verifyPassword('password', throws),
      ).rejects.toBeInstanceOf(ClinicInvalidCredentialsError);
    });
  });

  describe('changeDefaultSchema', () => {
    it('accepts null and a non-empty schema id, bumping updatedAt', () => {
      const clinic = buildClinic();
      const before = clinic.updatedAt;

      clinic.changeDefaultSchema('schema-2');
      expect(clinic.defaultExtractionSchemaId).toBe('schema-2');
      expect(clinic.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );

      clinic.changeDefaultSchema(null);
      expect(clinic.defaultExtractionSchemaId).toBeNull();
    });

    it('rejects a blank schema id', () => {
      expect(() => buildClinic().changeDefaultSchema('   ')).toThrow(
        ClinicValidationError,
      );
    });
  });

  describe('changePassword', () => {
    it('replaces the password hash', () => {
      const clinic = buildClinic();
      clinic.changePassword(PasswordHash.from('new-hash'));
      expect(clinic.passwordHash.value).toBe('new-hash');
    });

    it('rejects a value that is not a PasswordHash', () => {
      expect(() =>
        buildClinic().changePassword('not-a-hash' as unknown as PasswordHash),
      ).toThrow(ClinicValidationError);
    });
  });

  describe('updateRelationSchemas', () => {
    it('hydrates the clinic schema relations', () => {
      const clinic = buildClinic();
      const schemas = [buildSchema()];
      clinic.updateRelationSchemas(schemas);
      expect(clinic.extractionSchemas).toEqual(schemas);
    });
  });

  describe('findExtractionSchema', () => {
    it('resolves an explicitly requested schema among the loaded relations', () => {
      const schema = buildSchema();
      const clinic = buildClinic({
        extractionSchemas: [schema],
      });

      expect(clinic.findExtractionSchema(SCHEMA_ID)).toBe(schema);
    });

    it('returns null for a requested schema that is not among the relations', () => {
      const clinic = buildClinic({ extractionSchemas: [buildSchema()] });
      expect(clinic.findExtractionSchema('foreign-schema')).toBeNull();
    });

    it('resolves the default schema when no id is requested', () => {
      const schema = buildSchema();
      const clinic = buildClinic({
        defaultExtractionSchemaId: SCHEMA_ID,
        extractionSchemas: [schema],
      });

      expect(clinic.findExtractionSchema()).toBe(schema);
    });

    it('returns null when the default schema is not among the loaded relations', () => {
      const clinic = buildClinic({
        defaultExtractionSchemaId: 'missing-schema',
        extractionSchemas: [],
      });

      expect(clinic.findExtractionSchema()).toBeNull();
    });

    it('returns null when no default schema is configured', () => {
      const clinic = buildClinic();
      expect(clinic.findExtractionSchema()).toBeNull();
    });
  });
});
