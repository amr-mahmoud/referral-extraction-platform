import { BadRequestException } from '@nestjs/common';
import { normalizeExtractionSchemaFields } from './extraction-schema-input.mapper';

describe('normalizeExtractionSchemaFields', () => {
  describe('array form (in-app field builder)', () => {
    it('folds the wire-facing `name` into key and label', () => {
      const result = normalizeExtractionSchemaFields([
        { name: 'policy_number', description: 'Top right of page 1' },
      ]);

      expect(result).toEqual([
        {
          key: 'policy_number',
          label: 'policy_number',
          description: 'Top right of page 1',
        },
      ]);
    });

    it('keeps an explicit label distinct from the name', () => {
      const result = normalizeExtractionSchemaFields([
        {
          name: 'policy_number',
          label: 'Policy Number',
          description: 'Top right of page 1',
        },
      ]);

      expect(result[0].key).toBe('policy_number');
      expect(result[0].label).toBe('Policy Number');
    });

    it('accepts key/label without a name', () => {
      const result = normalizeExtractionSchemaFields([
        { key: 'referring_npi', description: "Provider's NPI" },
      ]);

      expect(result[0].key).toBe('referring_npi');
      expect(result[0].label).toBe('referring_npi');
    });

    it('passes a missing name through for the domain to reject', () => {
      // Structural shape is fine here; the "every field needs a name" rule is
      // the domain's to enforce, so this must not throw at the boundary.
      const result = normalizeExtractionSchemaFields([
        { description: 'orphaned description' },
      ]);

      expect(result).toEqual([
        {
          key: undefined,
          label: undefined,
          description: 'orphaned description',
        },
      ]);
    });

    it('rejects a non-object entry', () => {
      expect(() => normalizeExtractionSchemaFields(['nope'])).toThrow(
        BadRequestException,
      );
    });

    it('rejects a non-string name', () => {
      expect(() =>
        normalizeExtractionSchemaFields([{ name: 42, description: 'x' }]),
      ).toThrow(BadRequestException);
    });
  });

  describe('flat map form (uploaded JSON config)', () => {
    it('converts each entry into a field definition', () => {
      const result = normalizeExtractionSchemaFields({
        policy_number: 'Insurance policy number, top right of page 1',
        referring_npi: "Referring provider's NPI number",
      });

      expect(result).toEqual([
        {
          key: 'policy_number',
          label: 'policy_number',
          description: 'Insurance policy number, top right of page 1',
        },
        {
          key: 'referring_npi',
          label: 'referring_npi',
          description: "Referring provider's NPI number",
        },
      ]);
    });

    it('rejects a non-string description value', () => {
      expect(() =>
        normalizeExtractionSchemaFields({ policy_number: { nested: true } }),
      ).toThrow(BadRequestException);
    });
  });

  describe('unusable input', () => {
    it.each([[null], [undefined], ['a string'], [42]])(
      'rejects %p',
      (input) => {
        expect(() => normalizeExtractionSchemaFields(input)).toThrow(
          BadRequestException,
        );
      },
    );
  });

  it('produces the same result from both input shapes', () => {
    const fromArray = normalizeExtractionSchemaFields([
      { name: 'policy_number', description: 'Top right of page 1' },
    ]);
    const fromMap = normalizeExtractionSchemaFields({
      policy_number: 'Top right of page 1',
    });

    expect(fromArray).toEqual(fromMap);
  });
});
