import { Schema, Type } from '@google/genai';

export interface FieldDefinition {
  key: string;
  label: string;
  description: string;
}

export const DEFAULT_EXTRACTION_FIELDS: FieldDefinition[] = [
  {
    key: 'patient_name',
    label: 'Patient Name',
    description: 'Full name of the patient.',
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    description: 'Patient date of birth.',
  },
  {
    key: 'referring_provider',
    label: 'Referring Provider',
    description: 'Name of the referring physician or clinic.',
  },
  {
    key: 'referred_to',
    label: 'Referred To',
    description: 'Specialty, practice, or provider the patient is referred to.',
  },
  {
    key: 'reason_for_referral',
    label: 'Reason for Referral',
    description: 'Clinical reason for the referral.',
  },
  {
    key: 'primary_diagnosis',
    label: 'Primary Diagnosis',
    description: 'Primary diagnosis or clinical summary.',
  },
  {
    key: 'icd_10_code',
    label: 'ICD-10 Code',
    description: 'Diagnosis code in ICD-10 format.',
  },
  {
    key: 'referral_date',
    label: 'Referral Date',
    description: 'Date the referral was issued.',
  },
  {
    key: 'patient_phone',
    label: 'Patient Phone',
    description: 'Patient contact phone number.',
  },
];

export function buildGeminiExtractionSchema(
  schemaDefinition: FieldDefinition[] | null,
): Schema {
  const fields = schemaDefinition ?? DEFAULT_EXTRACTION_FIELDS;

  return {
    type: Type.OBJECT,
    properties: {
      isValidDocument: {
        type: Type.BOOLEAN,
        description:
          'True if the document is genuinely a medical referral or clinical document.',
      },
      rejectionReason: {
        type: Type.STRING,
        description:
          'If isValidDocument is false, explain exactly why it was rejected. Null if valid.',
        nullable: true,
      },
      extractedFields: {
        type: Type.ARRAY,
        description: 'The extracted medical fields and their spatial data.',
        items: {
          type: Type.OBJECT,
          properties: {
            fieldName: {
              type: Type.STRING,
              description: `One of the allowed field keys: ${fields
                .map((field) => field.key)
                .join(', ')}.`,
            },
            fieldValue: {
              type: Type.STRING,
              description: 'The extracted value directly from the document.',
            },
            pageNumber: {
              type: Type.INTEGER,
              description:
                'The 1-indexed page number where the data was found (page 1 = first page).',
            },
            boundingBox: {
              type: Type.OBJECT,
              description:
                'Normalized bounding box {xmin, ymin, xmax, ymax} between 0 and 1000.',
              properties: {
                xmin: {
                  type: Type.NUMBER,
                  description: 'Minimum X (left) coordinate, 0-1000.',
                },
                ymin: {
                  type: Type.NUMBER,
                  description: 'Minimum Y (top) coordinate, 0-1000.',
                },
                xmax: {
                  type: Type.NUMBER,
                  description: 'Maximum X (right) coordinate, 0-1000.',
                },
                ymax: {
                  type: Type.NUMBER,
                  description: 'Maximum Y (bottom) coordinate, 0-1000.',
                },
              },
              required: ['xmin', 'ymin', 'xmax', 'ymax'],
              nullable: true,
            },
          },
          required: ['fieldName', 'fieldValue', 'pageNumber'],
        },
      },
    },
    required: ['isValidDocument', 'extractedFields'],
  };
}

export function buildFieldInstructions(
  schemaDefinition: FieldDefinition[] | null,
): string {
  const fields = schemaDefinition ?? DEFAULT_EXTRACTION_FIELDS;
  return fields
    .map((field) => `- ${field.key} (${field.label}): ${field.description}`)
    .join('\n');
}
