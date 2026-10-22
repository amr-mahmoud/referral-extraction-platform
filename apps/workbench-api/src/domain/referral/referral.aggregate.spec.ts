import { InvalidReferralIdError, Referral } from './referral.aggregate';
import { BoundingBox } from './bounding-box.value-object';
import {
  ExtractedField,
  InvalidExtractedFieldError,
} from './extracted-field.value-object';
import {
  DuplicateExtractedFieldKeyError,
  ExtractedFieldNotFoundError,
  ReferralCorrectionNotAllowedError,
  ReferralFileNameError,
  ReferralNotFoundError,
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

/** A referral in the `PROCESSING` state (PENDING → PROCESSING). */
function toProcessing(referral: Referral): Referral {
  referral.startProcessing();
  return referral;
}

describe('Referral', () => {
  describe('construction', () => {
    it('creates a valid referral with a generated id and PENDING defaults', () => {
      const referral = buildReferral();

      expect(referral.id).toMatch(UUID_REGEX);
      expect(referral.clinicId).toBe('clinic-1');
      expect(referral.fileName).toBe('referral.pdf');
      expect(referral.patientName).toBeNull();
      expect(referral.extractionSchemaId).toBeNull();
      expect(referral.status.value).toBe(ReferralStatusValue.PENDING);
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
    it('resolves a schema id on a fresh (PENDING) referral', () => {
      const referral = buildReferral();
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
    it('moves a fresh PENDING referral to PROCESSING via startProcessing', () => {
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

      expect(() => referral.startProcessing()).toThrow(
        InvalidReferralStatusTransitionError,
      );
      expect(() => referral.complete([])).toThrow(
        InvalidReferralStatusTransitionError,
      );
    });
  });

  describe('field correction', () => {
    const AI_BOUNDING_BOX = new BoundingBox(0.1, 0.2, 0.3, 0.4);

    function buildAiField(
      key: string,
      value: string,
      pageNumber = 2,
      boundingBox: BoundingBox | null = AI_BOUNDING_BOX,
    ): ExtractedField {
      return new ExtractedField(
        key,
        `${key} label`,
        value,
        pageNumber,
        boundingBox,
      );
    }

    function buildCompletedReferral(): Referral {
      const referral = toProcessing(buildReferral({ patientName: 'Jane Doe' }));
      referral.complete([
        buildAiField('patient_name', 'Jane Doe'),
        buildAiField('referring_physician', 'Dr. Smith'),
      ]);
      return referral;
    }

    function findField(referral: Referral, key: string): ExtractedField {
      const field = referral.extractedPayload.find((f) => f.key === key);
      if (!field) throw new Error(`test setup: field '${key}' not found`);
      return field;
    }

    describe('availability', () => {
      it.each([
        [
          'correctField',
          (r: Referral) => r.correctField('patient_name', { value: 'x' }),
        ],
        [
          'addReviewerField',
          (r: Referral) =>
            r.addReviewerField({ key: 'new_key', label: 'New', value: 'x' }),
        ],
        [
          'revertFieldToAiOriginal',
          (r: Referral) => r.revertFieldToAiOriginal('patient_name'),
        ],
      ])('%s rejects a PENDING referral', (_name, act) => {
        expect(() => act(buildReferral())).toThrow(
          ReferralCorrectionNotAllowedError,
        );
      });

      it.each([
        [
          'correctField',
          (r: Referral) => r.correctField('patient_name', { value: 'x' }),
        ],
        [
          'addReviewerField',
          (r: Referral) =>
            r.addReviewerField({ key: 'new_key', label: 'New', value: 'x' }),
        ],
        [
          'revertFieldToAiOriginal',
          (r: Referral) => r.revertFieldToAiOriginal('patient_name'),
        ],
      ])('%s rejects a PROCESSING / FAILED referral', (_name, act) => {
        expect(() => act(toProcessing(buildReferral()))).toThrow(
          ReferralCorrectionNotAllowedError,
        );
        const failed = toProcessing(buildReferral());
        failed.fail('boom');
        expect(() => act(failed)).toThrow(ReferralCorrectionNotAllowedError);
      });

      it.each([
        [
          'correctField',
          (r: Referral) => r.correctField('patient_name', { value: 'x' }),
        ],
        [
          'addReviewerField',
          (r: Referral) =>
            r.addReviewerField({ key: 'new_key', label: 'New', value: 'x' }),
        ],
        [
          'revertFieldToAiOriginal',
          (r: Referral) => r.revertFieldToAiOriginal('patient_name'),
        ],
      ])(
        '%s rejects a COMPLETED referral with an empty extraction',
        (_name, act) => {
          const referral = toProcessing(buildReferral());
          referral.complete([]);
          expect(() => act(referral)).toThrow(
            ReferralCorrectionNotAllowedError,
          );
        },
      );
    });

    describe('correctField', () => {
      it('changes the value, snapshots the AI original and stamps correctedAt', () => {
        const referral = buildCompletedReferral();

        referral.correctField('referring_physician', { value: 'Dr. Jones' });

        const field = findField(referral, 'referring_physician');
        expect(field.value).toBe('Dr. Jones');
        expect(field.source).toBe('AI');
        expect(field.aiOriginal).toEqual({
          key: 'referring_physician',
          label: 'referring_physician label',
          value: 'Dr. Smith',
        });
        expect(field.correctedAt).toBeInstanceOf(Date);
      });

      it('renames key and label and keeps the AI original under the old key', () => {
        const referral = buildCompletedReferral();

        referral.correctField('referring_physician', {
          key: 'primary_care_physician',
          label: 'Primary care physician',
          value: 'Dr. Smith',
        });

        expect(referral.extractedPayload.map((f) => f.key)).not.toContain(
          'referring_physician',
        );
        const field = findField(referral, 'primary_care_physician');
        expect(field.label).toBe('Primary care physician');
        expect(field.aiOriginal).toEqual({
          key: 'referring_physician',
          label: 'referring_physician label',
          value: 'Dr. Smith',
        });
      });

      it('keeps the first AI snapshot across later edits', () => {
        const referral = buildCompletedReferral();

        referral.correctField('referring_physician', { value: 'Dr. Jones' });
        referral.correctField('referring_physician', { value: 'Dr. Brown' });

        const field = findField(referral, 'referring_physician');
        expect(field.value).toBe('Dr. Brown');
        expect(field.aiOriginal?.value).toBe('Dr. Smith');
      });

      it('keeps page number and bounding box through value and key edits', () => {
        const referral = buildCompletedReferral();

        referral.correctField('referring_physician', {
          key: 'pcp',
          label: 'PCP',
          value: 'Dr. Jones',
        });

        const field = findField(referral, 'pcp');
        expect(field.pageNumber).toBe(2);
        expect(field.boundingBox).toEqual(AI_BOUNDING_BOX);
      });

      it('resets the field to unedited when edited back to the AI original', () => {
        const referral = buildCompletedReferral();
        referral.correctField('referring_physician', { value: 'Dr. Jones' });

        referral.correctField('referring_physician', { value: 'Dr. Smith' });

        const field = findField(referral, 'referring_physician');
        expect(field.aiOriginal).toBeNull();
        expect(field.source).toBe('AI');
        expect(field.value).toBe('Dr. Smith');
      });

      it('allows clearing a value to the empty string', () => {
        const referral = buildCompletedReferral();
        referral.correctField('referring_physician', { value: '' });
        expect(findField(referral, 'referring_physician').value).toBe('');
      });

      it('advances updatedAt', () => {
        jest.useFakeTimers();
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
          const referral = buildCompletedReferral();
          const before = referral.updatedAt.getTime();
          jest.setSystemTime(new Date('2026-01-01T00:00:05Z'));

          referral.correctField('referring_physician', { value: 'Dr. Jones' });

          expect(referral.updatedAt.getTime()).toBeGreaterThan(before);
        } finally {
          jest.useRealTimers();
        }
      });

      it('also updates referral.patientName when the patient-name field is corrected', () => {
        const referral = buildCompletedReferral();

        referral.correctField('patient_name', { value: 'Janet Doe' });

        expect(referral.patientName).toBe('Janet Doe');
      });

      it('does not touch patientName when another field is corrected', () => {
        const referral = buildCompletedReferral();
        referral.correctField('referring_physician', { value: 'Dr. Jones' });
        expect(referral.patientName).toBe('Jane Doe');
      });

      it('throws ExtractedFieldNotFoundError for an unknown field', () => {
        expect(() =>
          buildCompletedReferral().correctField('nope', { value: 'x' }),
        ).toThrow(ExtractedFieldNotFoundError);
      });

      it('throws DuplicateExtractedFieldKeyError when renaming onto an existing key', () => {
        expect(() =>
          buildCompletedReferral().correctField('referring_physician', {
            key: 'patient_name',
            value: 'x',
          }),
        ).toThrow(DuplicateExtractedFieldKeyError);
      });

      it('allows "renaming" a field to its own current key', () => {
        const referral = buildCompletedReferral();
        expect(() =>
          referral.correctField('referring_physician', {
            key: 'referring_physician',
            value: 'Dr. Jones',
          }),
        ).not.toThrow();
      });

      it.each([
        'Patient Name',
        'camelCase',
        '1starts_with_digit',
        'has-dash',
        '',
        '  ',
      ])('throws InvalidExtractedFieldError for key %j', (badKey) => {
        expect(() =>
          buildCompletedReferral().correctField('referring_physician', {
            key: badKey,
            value: 'x',
          }),
        ).toThrow(InvalidExtractedFieldError);
      });

      it('throws InvalidExtractedFieldError for an empty label', () => {
        expect(() =>
          buildCompletedReferral().correctField('referring_physician', {
            label: '',
            value: 'x',
          }),
        ).toThrow(InvalidExtractedFieldError);
      });

      it('leaves the payload unchanged when a correction is rejected', () => {
        const referral = buildCompletedReferral();
        expect(() =>
          referral.correctField('referring_physician', {
            key: 'patient_name',
            value: 'x',
          }),
        ).toThrow(DuplicateExtractedFieldKeyError);
        expect(findField(referral, 'referring_physician').value).toBe(
          'Dr. Smith',
        );
        expect(
          findField(referral, 'referring_physician').aiOriginal,
        ).toBeNull();
      });
    });

    describe('addReviewerField', () => {
      it('appends a REVIEWER field with no page and no bounding box', () => {
        const referral = buildCompletedReferral();

        referral.addReviewerField({
          key: 'insurance_id',
          label: 'Insurance ID',
          value: 'A-123',
        });

        const field =
          referral.extractedPayload[referral.extractedPayload.length - 1];
        expect(field.key).toBe('insurance_id');
        expect(field.label).toBe('Insurance ID');
        expect(field.value).toBe('A-123');
        expect(field.source).toBe('REVIEWER');
        expect(field.pageNumber).toBeNull();
        expect(field.boundingBox).toBeNull();
        expect(field.aiOriginal).toBeNull();
      });

      it('advances updatedAt', () => {
        jest.useFakeTimers();
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
          const referral = buildCompletedReferral();
          const before = referral.updatedAt.getTime();
          jest.setSystemTime(new Date('2026-01-01T00:00:05Z'));
          referral.addReviewerField({
            key: 'insurance_id',
            label: 'Insurance ID',
            value: 'A-123',
          });
          expect(referral.updatedAt.getTime()).toBeGreaterThan(before);
        } finally {
          jest.useRealTimers();
        }
      });

      it('allows an empty value', () => {
        const referral = buildCompletedReferral();
        expect(() =>
          referral.addReviewerField({
            key: 'notes',
            label: 'Notes',
            value: '',
          }),
        ).not.toThrow();
      });

      it('throws DuplicateExtractedFieldKeyError for an existing key', () => {
        expect(() =>
          buildCompletedReferral().addReviewerField({
            key: 'patient_name',
            label: 'X',
            value: 'x',
          }),
        ).toThrow(DuplicateExtractedFieldKeyError);
      });

      it('throws InvalidExtractedFieldError for a non-snake_case key', () => {
        expect(() =>
          buildCompletedReferral().addReviewerField({
            key: 'Bad Key',
            label: 'X',
            value: 'x',
          }),
        ).toThrow(InvalidExtractedFieldError);
      });

      it('throws InvalidExtractedFieldError for an empty label', () => {
        expect(() =>
          buildCompletedReferral().addReviewerField({
            key: 'good_key',
            label: '',
            value: 'x',
          }),
        ).toThrow(InvalidExtractedFieldError);
      });
    });

    describe('revertFieldToAiOriginal', () => {
      it('restores key, label and value and clears provenance', () => {
        const referral = buildCompletedReferral();
        referral.correctField('referring_physician', {
          key: 'pcp',
          label: 'PCP',
          value: 'Dr. Jones',
        });

        referral.revertFieldToAiOriginal('pcp');

        const field = findField(referral, 'referring_physician');
        expect(field.label).toBe('referring_physician label');
        expect(field.value).toBe('Dr. Smith');
        expect(field.aiOriginal).toBeNull();
        expect(field.source).toBe('AI');
        expect(field.pageNumber).toBe(2);
        expect(field.boundingBox).toEqual(AI_BOUNDING_BOX);
      });

      it('reverting the patient-name field restores referral.patientName', () => {
        const referral = buildCompletedReferral();
        referral.correctField('patient_name', { value: 'Janet Doe' });
        referral.revertFieldToAiOriginal('patient_name');
        expect(referral.patientName).toBe('Jane Doe');
      });

      it('throws ExtractedFieldNotFoundError for an unknown field', () => {
        expect(() =>
          buildCompletedReferral().revertFieldToAiOriginal('nope'),
        ).toThrow(ExtractedFieldNotFoundError);
      });

      it('rejects reverting an unedited AI field', () => {
        expect(() =>
          buildCompletedReferral().revertFieldToAiOriginal('patient_name'),
        ).toThrow(ReferralCorrectionNotAllowedError);
      });

      it('rejects reverting a reviewer-added field', () => {
        const referral = buildCompletedReferral();
        referral.addReviewerField({
          key: 'insurance_id',
          label: 'Insurance ID',
          value: 'A-123',
        });
        expect(() => referral.revertFieldToAiOriginal('insurance_id')).toThrow(
          ReferralCorrectionNotAllowedError,
        );
      });

      it('advances updatedAt', () => {
        jest.useFakeTimers();
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
          const referral = buildCompletedReferral();
          referral.correctField('referring_physician', { value: 'Dr. Jones' });
          const before = referral.updatedAt.getTime();
          jest.setSystemTime(new Date('2026-01-01T00:00:05Z'));
          referral.revertFieldToAiOriginal('referring_physician');
          expect(referral.updatedAt.getTime()).toBeGreaterThan(before);
        } finally {
          jest.useRealTimers();
        }
      });
    });

    describe('review follow-ups', () => {
      function buildCompletedReferralWithNonSnakeKey(): Referral {
        const referral = toProcessing(
          buildReferral({ patientName: 'Jane Doe' }),
        );
        referral.complete([
          buildAiField('Patient Name', 'Jane Doe'),
          buildAiField('referring_physician', 'Dr. Smith'),
        ]);
        return referral;
      }

      describe('non-snake_case AI keys', () => {
        it('allows a value-only correction on an AI field whose key is not snake_case', () => {
          const referral = buildCompletedReferralWithNonSnakeKey();

          referral.correctField('Patient Name', { value: 'Janet Doe' });

          const field = findField(referral, 'Patient Name');
          expect(field.value).toBe('Janet Doe');
          expect(field.aiOriginal?.key).toBe('Patient Name');
        });

        it('still rejects renaming to a non-snake_case key', () => {
          expect(() =>
            buildCompletedReferralWithNonSnakeKey().correctField(
              'Patient Name',
              {
                key: 'Other Key',
                value: 'x',
              },
            ),
          ).toThrow(InvalidExtractedFieldError);
        });

        it('allows reverting to a non-snake_case AI original key', () => {
          const referral = buildCompletedReferralWithNonSnakeKey();
          referral.correctField('Patient Name', {
            key: 'patient_full_name',
            value: 'Jane Doe',
          });

          expect(() =>
            referral.revertFieldToAiOriginal('patient_full_name'),
          ).not.toThrow();

          const field = findField(referral, 'Patient Name');
          expect(field.aiOriginal).toBeNull();
          expect(field.value).toBe('Jane Doe');
        });
      });

      describe('patient_name sync', () => {
        it('clears patientName when the patient_name field is renamed away', () => {
          const referral = buildCompletedReferral();

          referral.correctField('patient_name', {
            key: 'full_name',
            value: 'Jane Doe',
          });

          expect(referral.patientName).toBeNull();
        });

        it('sets patientName again when a revert restores the patient_name key', () => {
          const referral = buildCompletedReferral();
          referral.correctField('patient_name', {
            key: 'full_name',
            value: 'Janet Doe',
          });
          expect(referral.patientName).toBeNull();

          referral.revertFieldToAiOriginal('full_name');

          expect(referral.patientName).toBe('Jane Doe');
        });

        it('trims patientName and stores the field value exactly as typed', () => {
          const referral = buildCompletedReferral();

          referral.correctField('patient_name', { value: '  Janet Doe  ' });

          expect(findField(referral, 'patient_name').value).toBe(
            '  Janet Doe  ',
          );
          expect(referral.patientName).toBe('Janet Doe');
        });
      });

      describe('whitespace-only label', () => {
        it('is rejected by correctField', () => {
          expect(() =>
            buildCompletedReferral().correctField('referring_physician', {
              label: '   ',
              value: 'x',
            }),
          ).toThrow(InvalidExtractedFieldError);
        });

        it('is rejected by addReviewerField', () => {
          expect(() =>
            buildCompletedReferral().addReviewerField({
              key: 'good_key',
              label: '   ',
              value: 'x',
            }),
          ).toThrow(InvalidExtractedFieldError);
        });
      });
    });
  });

  describe('updateStatus', () => {
    it('completes a PENDING referral with payload, patient name, and no error', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.PENDING),
        errorMessage: 'stale',
      });
      const payload = [buildField('patient_name', 'Jane Doe')];

      referral.updateStatus(
        ReferralStatusValue.COMPLETED,
        payload,
        'Jane Doe',
        null,
      );

      expect(referral.status.value).toBe(ReferralStatusValue.COMPLETED);
      expect(referral.extractedPayload).toEqual(payload);
      expect(referral.patientName).toBe('Jane Doe');
      expect(referral.errorMessage).toBeNull();
    });

    it('completes a fresh PENDING referral directly, skipping PROCESSING', () => {
      const referral = buildReferral();

      referral.updateStatus(ReferralStatusValue.COMPLETED, [], null, null);

      expect(referral.status.value).toBe(ReferralStatusValue.COMPLETED);
    });

    it('marks a referral REJECTED and records the reason', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.PENDING),
      });

      referral.updateStatus(
        ReferralStatusValue.REJECTED,
        [],
        null,
        'Not a referral',
      );

      expect(referral.status.value).toBe(ReferralStatusValue.REJECTED);
      expect(referral.errorMessage).toBe('Not a referral');
    });

    it('records the failure reason on a FAILED referral', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.PENDING),
      });

      referral.updateStatus(
        ReferralStatusValue.FAILED,
        [],
        null,
        'Gemini timeout',
      );

      expect(referral.status.value).toBe(ReferralStatusValue.FAILED);
      expect(referral.errorMessage).toBe('Gemini timeout');
    });

    it('allows a retried job to complete a FAILED referral', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.FAILED),
      });

      referral.updateStatus(
        ReferralStatusValue.COMPLETED,
        [buildField()],
        null,
        null,
      );

      expect(referral.status.value).toBe(ReferralStatusValue.COMPLETED);
      expect(referral.errorMessage).toBeNull();
    });

    it('allows a retried job to move a FAILED referral back to PROCESSING', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.FAILED),
      });

      referral.startProcessing();

      expect(referral.status.value).toBe(ReferralStatusValue.PROCESSING);
    });

    it('rejects a non-terminal worker status', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.PENDING),
      });

      expect(() =>
        referral.updateStatus(ReferralStatusValue.PROCESSING, [], null, null),
      ).toThrow(ReferralValidationError);
    });

    it('rejects any update once the referral is in a terminal state', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.COMPLETED),
      });

      expect(() =>
        referral.updateStatus(ReferralStatusValue.COMPLETED, [], null, null),
      ).toThrow(InvalidReferralStatusTransitionError);
      expect(referral.isInTerminalState).toBe(true);
    });

    it('treats FAILED as retryable, not terminal', () => {
      const referral = buildReferral({
        status: ReferralStatus.from(ReferralStatusValue.FAILED),
      });
      expect(referral.isInTerminalState).toBe(false);
    });
  });

  describe('assertBelongsToClinic', () => {
    it('accepts the owning clinic', () => {
      const referral = buildReferral({ clinicId: 'clinic-1' });
      expect(() => referral.assertBelongsToClinic('clinic-1')).not.toThrow();
    });

    it('rejects a foreign clinic without leaking existence', () => {
      const referral = buildReferral({ clinicId: 'clinic-1' });
      expect(() => referral.assertBelongsToClinic('clinic-2')).toThrow(
        ReferralNotFoundError,
      );
    });
  });
});
