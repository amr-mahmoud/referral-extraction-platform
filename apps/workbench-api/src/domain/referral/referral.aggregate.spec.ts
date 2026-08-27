import { InvalidReferralIdError, Referral } from './referral.aggregate';
import { ExtractedField } from './extracted-field.value-object';
import {
  ReferralCorrectionNotAllowedError,
  ReferralFileNameError,
  ReferralSchemaAlreadyFixedError,
  ReferralValidationError,
} from './referral.errors';
import {
  InvalidReferralStatusTransitionError,
  ReferralStatus,
} from './referral-status.value-object';
import { ReferralStatusValue } from './types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildField(key = 'patient_name', value = 'Jane Doe'): ExtractedField {
  return new ExtractedField(key, key, value, 1, null);
}

function buildReferral(
  overrides?: Partial<ConstructorParameters<typeof Referral>[0]>,
): Referral {
  return new Referral({
    clinicId: 'clinic-1',
    fileName: 'referral.pdf',
    ...overrides,
  });
}

/** A referral in the `PROCESSING` state (AWAITING_UPLOAD → PENDING → PROCESSING). */
function toProcessing(referral: Referral): Referral {
  referral.markUploaded();
  referral.startProcessing();
  return referral;
}

describe('Referral', () => {
  describe('construction', () => {
    it('creates a valid referral with a generated id and AWAITING_UPLOAD defaults', () => {
      const referral = buildReferral();

      expect(referral.id).toMatch(UUID_REGEX);
      expect(referral.clinicId).toBe('clinic-1');
      expect(referral.fileName).toBe('referral.pdf');
      expect(referral.patientName).toBeNull();
      expect(referral.extractionSchemaId).toBeNull();
      expect(referral.status.value).toBe(ReferralStatusValue.AWAITING_UPLOAD);
      expect(referral.extractedPayload).toEqual([]);
      expect(referral.errorMessage).toBeNull();
      expect(referral.createdAt).toBeInstanceOf(Date);
      expect(referral.updatedAt).toBeInstanceOf(Date);
    });

    it('uses a provided id, trimmed', () => {
      expect(buildReferral({ id: '  referral-1  ' }).id).toBe('referral-1');
    });

    it('rejects an empty id', () => {
      expect(() => buildReferral({ id: '   ' })).toThrow(
        InvalidReferralIdError,
      );
    });

    it('requires a clinicId', () => {
      expect(() =>
        buildReferral({ clinicId: undefined as unknown as string }),
      ).toThrow(ReferralValidationError);
    });

    it('rejects an empty file name', () => {
      expect(() => buildReferral({ fileName: '   ' })).toThrow(
        ReferralFileNameError,
      );
    });

    it('rejects a file name that does not end in .pdf', () => {
      expect(() => buildReferral({ fileName: 'referral.docx' })).toThrow(
        ReferralFileNameError,
      );
    });

    it('rejects an empty patient name when provided', () => {
      expect(() => buildReferral({ patientName: '   ' })).toThrow(
        ReferralValidationError,
      );
    });

    it('hydrates schema, payload, error, and status when provided', () => {
      const payload = [buildField()];
      const referral = buildReferral({
        extractionSchemaId: 'schema-1',
        extractedPayload: payload,
        errorMessage: 'boom',
        status: ReferralStatus.from(ReferralStatusValue.PROCESSING),
      });

      expect(referral.extractionSchemaId).toBe('schema-1');
      expect(referral.extractedPayload).toEqual(payload);
      expect(referral.errorMessage).toBe('boom');
      expect(referral.status.value).toBe(ReferralStatusValue.PROCESSING);
    });
  });

  describe('id helpers', () => {
    it('generates a UUID id', () => {
      expect(buildReferral().generateId()).toMatch(UUID_REGEX);
    });

    it('validates and trims a non-empty id', () => {
      expect(buildReferral().validateId('  referral-1  ')).toBe('referral-1');
    });

    it('rejects a blank id', () => {
      const referral = buildReferral();
      expect(() => referral.validateId('   ')).toThrow(InvalidReferralIdError);
      expect(() => referral.validateId('')).toThrow(InvalidReferralIdError);
    });
  });

  describe('resolveSchema', () => {
    it('resolves a schema id on a fresh referral', () => {
      const referral = buildReferral();
      referral.resolveSchema('schema-1');
      expect(referral.extractionSchemaId).toBe('schema-1');
    });

    it('resolves a schema id on a PENDING referral', () => {
      const referral = buildReferral();
      referral.markUploaded();
      referral.resolveSchema('schema-1');
      expect(referral.extractionSchemaId).toBe('schema-1');
    });

    it('allows re-resolving the same schema id', () => {
      const referral = buildReferral();
      referral.resolveSchema('schema-1');
      referral.resolveSchema('schema-1');
      expect(referral.extractionSchemaId).toBe('schema-1');
    });

    it('rejects a different schema id once one is already resolved', () => {
      const referral = buildReferral();
      referral.resolveSchema('schema-1');
      expect(() => referral.resolveSchema('schema-2')).toThrow(
        ReferralSchemaAlreadyFixedError,
      );
    });

    it('rejects resolving a schema on a terminal referral', () => {
      const referral = toProcessing(buildReferral());
      referral.complete([buildField()]);
      expect(() => referral.resolveSchema('schema-1')).toThrow(
        ReferralSchemaAlreadyFixedError,
      );
    });
  });

  describe('state machine', () => {
    it('moves AWAITING_UPLOAD → PENDING via markUploaded', () => {
      const referral = buildReferral();
      referral.markUploaded();
      expect(referral.status.value).toBe(ReferralStatusValue.PENDING);
    });

    it('moves AWAITING_UPLOAD → PROCESSING via startProcessing', () => {
      const referral = buildReferral();
      referral.startProcessing();
      expect(referral.status.value).toBe(ReferralStatusValue.PROCESSING);
    });

    it('completes a PROCESSING referral with the payload and clears the error', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.PROCESSING),
        errorMessage: 'old',
      });
      const payload = [buildField()];

      referral.complete(payload);

      expect(referral.status.value).toBe(ReferralStatusValue.COMPLETED);
      expect(referral.extractedPayload).toEqual(payload);
      expect(referral.errorMessage).toBeNull();
    });

    it('fails a PROCESSING referral with an error message', () => {
      const referral = toProcessing(buildReferral());
      referral.fail('Gemini timeout');
      expect(referral.status.value).toBe(ReferralStatusValue.FAILED);
      expect(referral.errorMessage).toBe('Gemini timeout');
    });

    it('rejects a transition that is not allowed from the current state', () => {
      const referral = toProcessing(buildReferral());
      referral.complete([buildField()]);

      expect(() => referral.markUploaded()).toThrow(
        InvalidReferralStatusTransitionError,
      );
      expect(() => referral.startProcessing()).toThrow(
        InvalidReferralStatusTransitionError,
      );
      expect(() => referral.complete([])).toThrow(
        InvalidReferralStatusTransitionError,
      );
    });
  });

  describe('applyCorrection', () => {
    it('updates the payload of a COMPLETED referral', () => {
      const referral = toProcessing(buildReferral());
      referral.complete([buildField('original', 'Old value')]);

      const corrected = [buildField('patient_name', 'Corrected value')];
      referral.applyCorrection(corrected);

      expect(referral.extractedPayload).toEqual(corrected);
    });

    it('rejects a correction on a non-COMPLETED referral', () => {
      const referral = buildReferral();
      expect(() => referral.applyCorrection([buildField()])).toThrow(
        ReferralCorrectionNotAllowedError,
      );
    });
  });
});
