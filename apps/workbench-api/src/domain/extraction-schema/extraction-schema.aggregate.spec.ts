import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchema } from './extraction-schema.aggregate';
import {
  ExtractionSchemaEmptyError,
  ExtractionSchemaValidationError,
} from './extraction-schema.errors';
import { InvalidFieldDefinitionError } from './field-definition.value-object';

describe('ExtractionSchema', () => {
  const clinicId = ClinicId.from('11111111-1111-1111-1111-111111111111');

  const validFields = [
    { key: 'patient_name', description: 'Full legal name of the patient' },
    { key: 'date_of_birth', description: 'Patient date of birth' },
  ];

  describe('construction', () => {
    it('assigns every field and builds FieldDefinition VOs', () => {
      const schema = new ExtractionSchema({
        clinicId,
        version: 1,
        schemaDefinition: validFields,
      });

      // Guards the regression where id/clinicId/schemaDefinition were declared
      // but never assigned in the constructor.
      expect(schema.id).toEqual(expect.any(String));
      expect(schema.clinicId.value).toBe(clinicId.value);
      expect(schema.version).toBe(1);
      expect(schema.createdAt).toBeInstanceOf(Date);
      expect(schema.schemaDefinition).toHaveLength(2);
      expect(schema.schemaDefinition[0].key).toBe('patient_name');
      expect(schema.schemaDefinition[0].label).toBe('patient_name');
      expect(schema.schemaDefinition[0].description).toBe(
        'Full legal name of the patient',
      );
    });

    it('generates a UUID when no id is supplied', () => {
      const schema = new ExtractionSchema({
        clinicId,
        version: 1,
        schemaDefinition: validFields,
      });

      expect(schema.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('round-trips a supplied UUID id', () => {
      const id = '22222222-2222-4222-8222-222222222222';

      const schema = new ExtractionSchema({
        id,
        clinicId,
        version: 3,
        schemaDefinition: validFields,
      });

      // Guards the regression where validateIdFormat required digits only
      // (/^\d+$/) and so rejected every id the database actually stores.
      expect(schema.id).toBe(id);
    });

    it('rejects a non-UUID id', () => {
      expect(
        () =>
          new ExtractionSchema({
            id: '12345',
            clinicId,
            version: 1,
            schemaDefinition: validFields,
          }),
      ).toThrow(ExtractionSchemaValidationError);
    });

    it('requires a clinicId', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId: undefined as unknown as ClinicId,
            version: 1,
            schemaDefinition: validFields,
          }),
      ).toThrow(ExtractionSchemaValidationError);
    });

    it('prefers an explicit label over the parameter name', () => {
      const schema = new ExtractionSchema({
        clinicId,
        version: 1,
        schemaDefinition: [
          { key: 'policy_number', label: 'Policy Number', description: 'p1' },
        ],
      });

      expect(schema.schemaDefinition[0].key).toBe('policy_number');
      expect(schema.schemaDefinition[0].label).toBe('Policy Number');
    });

    it('slugifies a parameter name into a stable key', () => {
      const schema = new ExtractionSchema({
        clinicId,
        version: 1,
        schemaDefinition: [{ key: 'Policy Number', description: 'p1' }],
      });

      expect(schema.schemaDefinition[0].key).toBe('policy_number');
      expect(schema.schemaDefinition[0].label).toBe('Policy Number');
    });
  });

  describe('versioning', () => {
    it('derives the next version from oldVersion', () => {
      const schema = new ExtractionSchema({
        clinicId,
        oldVersion: 3,
        schemaDefinition: validFields,
      });

      expect(schema.version).toBe(4);
    });

    it('gives a revision a fresh id rather than reusing the superseded one', () => {
      const first = new ExtractionSchema({
        clinicId,
        version: 1,
        schemaDefinition: validFields,
      });

      const second = new ExtractionSchema({
        clinicId,
        oldVersion: first.version,
        schemaDefinition: validFields,
      });

      // Each version is its own row under @@unique([clinicId, version]).
      expect(second.id).not.toBe(first.id);
      expect(second.version).toBe(2);
    });

    it('rejects a version that is not a positive integer', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 0,
            schemaDefinition: validFields,
          }),
      ).toThrow(ExtractionSchemaValidationError);

      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 1.5,
            schemaDefinition: validFields,
          }),
      ).toThrow(ExtractionSchemaValidationError);
    });

    it('rejects when neither version nor oldVersion is supplied', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            schemaDefinition: validFields,
          }),
      ).toThrow(ExtractionSchemaValidationError);
    });
  });

  describe('field invariants', () => {
    it('rejects an empty field list', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 1,
            schemaDefinition: [],
          }),
      ).toThrow(ExtractionSchemaEmptyError);
    });

    it('rejects a field with no parameter name', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 1,
            schemaDefinition: [{ description: 'A valid description' }],
          }),
      ).toThrow(InvalidFieldDefinitionError);
    });

    it('rejects a blank (whitespace-only) description', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 1,
            schemaDefinition: [{ key: 'patient_name', description: '   ' }],
          }),
      ).toThrow(InvalidFieldDefinitionError);
    });

    it('rejects two names that slugify to the same key', () => {
      expect(
        () =>
          new ExtractionSchema({
            clinicId,
            version: 1,
            schemaDefinition: [
              { key: 'Policy Number', description: 'first' },
              { key: 'policy-number', description: 'second' },
            ],
          }),
      ).toThrow(ExtractionSchemaValidationError);
    });
  });
});
