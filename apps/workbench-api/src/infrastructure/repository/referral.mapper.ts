import { Referral as PrismaReferral } from '@prisma/client';
import { BoundingBox } from '../../domain/referral/bounding-box.value-object';
import { ExtractedField } from '../../domain/referral/extracted-field.value-object';
import { Referral } from '../../domain/referral/referral.aggregate';
import { ReferralStatus } from '../../domain/referral/referral-status.value-object';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';

interface RawExtractedField {
  value: string;
  pageNumber: number;
  boundingBox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  } | null;
}

export class ReferralMapper {
  public static toDomain(raw: PrismaReferral): Referral {
    // The aggregate re-validates every VO it's handed, so the stored JSON is
    // passed through as raw shapes rather than pre-constructed value objects.
    const extractedPayload = Array.isArray(raw.extractedPayload)
      ? (raw.extractedPayload as unknown as RawExtractedField[]).map(
          (field) =>
            new ExtractedField(
              field.value,
              field.pageNumber,
              field.boundingBox
                ? new BoundingBox(
                    field.boundingBox.xmin,
                    field.boundingBox.ymin,
                    field.boundingBox.xmax,
                    field.boundingBox.ymax,
                  )
                : null,
            ),
        )
      : [];

    return new Referral({
      id: ReferralId.from(raw.id),
      clinicId: ClinicId.from(raw.clinicId),
      fileName: raw.fileName,
      patientName: raw.patientName,
      extractionSchemaId: raw.extractionSchemaId
        ? ExtractionSchemaId.from(raw.extractionSchemaId)
        : null,
      status: ReferralStatus.from(raw.status),
      extractedPayload,
      errorMessage: raw.errorMessage,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(referral: Referral) {
    return {
      id: referral.id,
      clinicId: referral.clinicId.value,
      fileName: referral.fileName,
      patientName: referral.patientName,
      s3Bucket: process.env.S3_BUCKET_NAME ?? 'plena-referrals',
      s3Key: `referrals/${referral.clinicId.value}/${referral.id}.pdf`,
      extractionSchemaId: referral.extractionSchemaId?.value ?? null,
      status: referral.status.value,
      extractedPayload: referral.extractedPayload.map((field) => ({
        value: field.value,
        pageNumber: field.pageNumber,
        boundingBox: field.boundingBox
          ? {
              xmin: field.boundingBox.xmin,
              ymin: field.boundingBox.ymin,
              xmax: field.boundingBox.xmax,
              ymax: field.boundingBox.ymax,
            }
          : null,
      })),
      errorMessage: referral.errorMessage,
      createdAt: referral.createdAt,
      updatedAt: referral.updatedAt,
    };
  }
}
