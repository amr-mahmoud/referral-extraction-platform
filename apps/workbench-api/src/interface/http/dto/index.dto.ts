import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../../../domain/referral/referral.aggregate';
import type { ReferralWithPresignedUpload } from '../../../application/application.service';
import type { ReferralListItemView } from '../../../application/read-models/referral-view.read-model';

export class SignupRequest {
  /** Full name or title of the clinic. */
  @IsString()
  @IsNotEmpty({ message: 'Clinic name is required' })
  public readonly clinicName!: string;

  /** Unique clinic username for authentication (3-50 chars, letters/numbers/_). */
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Matches(/^[a-zA-Z0-9_]{3,50}$/, {
    message:
      'Username must be 3-50 characters containing only letters, numbers, and underscores',
  })
  public readonly username!: string;

  /** Account password (minimum 8 characters). */
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  public readonly password!: string;
}

export class LoginRequest {
  /** Clinic username for authentication. */
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  public readonly username!: string;

  /** Clinic account password. */
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  public readonly password!: string;
}

export class ClinicDto {
  /** Unique clinic ID (UUID). */
  public readonly id!: string;

  /** Full name or title of the clinic. */
  public readonly clinicName!: string;

  /** Unique clinic username. */
  public readonly username!: string;

  /** Default extraction schema ID if configured. */
  public readonly defaultExtractionSchemaId!: string | null;

  /** Account creation timestamp. */
  public readonly createdAt!: Date;

  public static fromDomain(clinic: Clinic): ClinicDto {
    return {
      id: clinic.id.value,
      clinicName: clinic.clinicName,
      username: clinic.username,
      defaultExtractionSchemaId:
        clinic.defaultExtractionSchemaId?.value ?? null,
      createdAt: clinic.createdAt,
    };
  }
}

export class AuthResponseDto {
  /** Sanitized clinic profile information. */
  public readonly clinic!: ClinicDto;

  /** Signed JWT authentication token. */
  public readonly token!: string;
}

/**
 * One field on the wire.
 *
 * Deliberately carries no `class-validator` decorators: `fields` below is a
 * union (array or map) so `@ValidateNested` cannot descend into it without
 * breaking the map form. Field-level rules — a parameter name is required, a
 * description is required and non-empty — are enforced once in the domain by
 * `ExtractionSchema` / `FieldDefinition`, which keeps them true for every
 * entry point rather than only this one. `DomainExceptionFilter` surfaces
 * those as 400s.
 */
export class SchemaFieldDefinitionDto {
  /** Parameter name for the field, e.g. `policy_number`. */
  public readonly name?: string;

  /** Unique JSON property key for the extracted value. Defaults to `name`. */
  public readonly key?: string;

  /** Human-readable label displayed in UI workbench. Defaults to `name`. */
  public readonly label?: string;

  /** Mandatory guidance prompt description for Gemini LLM extractor. */
  public readonly description!: string;
}

export class CreateExtractionSchemaRequest {
  /**
   * Field definitions, accepted in either form:
   *  - an array of {@link SchemaFieldDefinitionDto} (in-app field builder), or
   *  - a flat `{ "field_name": "description" }` map (uploaded JSON config).
   *
   * Both are normalised by `normalizeExtractionSchemaFields` before reaching
   * the domain. Kept under this single property because the global
   * `ValidationPipe` runs with `forbidNonWhitelisted: true` — a bare top-level
   * map body would be rejected before it ever reached the controller.
   */
  @IsDefined({ message: 'fields is required' })
  @ApiProperty({
    oneOf: [
      {
        type: 'array',
        items: { $ref: '#/components/schemas/SchemaFieldDefinitionDto' },
      },
      { type: 'object', additionalProperties: { type: 'string' } },
    ],
    examples: {
      array: [{ name: 'policy_number', description: 'Top right of page 1' }],
      map: { policy_number: 'Top right of page 1' },
    },
  })
  public readonly fields!: SchemaFieldDefinitionDto[] | Record<string, string>;
}

export class ExtractionSchemaDto {
  /** Unique extraction schema ID (UUID). */
  public readonly id!: string;

  /** Owning clinic ID (UUID). */
  public readonly clinicId!: string;

  /** Schema version integer. */
  public readonly version!: number;

  /** Array of field definitions in this schema. */
  public readonly fields!: SchemaFieldDefinitionDto[];

  /** Creation timestamp. */
  public readonly createdAt!: Date;

  public static fromDomain(schema: ExtractionSchema): ExtractionSchemaDto {
    return {
      id: schema.id,
      clinicId: schema.clinicId.value,
      version: schema.version,
      fields: schema.schemaDefinition.map((f) => ({
        key: f.key,
        label: f.label,
        description: f.description,
      })),
      createdAt: schema.createdAt,
    };
  }
}

export class CreateReferralItemRequest {
  /** Original uploaded file name; must end in `.pdf`. Drives the S3 key. */
  @IsString()
  @IsNotEmpty({ message: 'fileName is required' })
  @Matches(/\.pdf$/i, { message: 'fileName must be a .pdf file' })
  public readonly fileName!: string;

  /** Optional patient name; usually unknown until extraction resolves one. */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'patientName must not be empty when provided' })
  public readonly patientName?: string | null;
}

export class CreateReferralsRequest {
  /** One or more files to create referrals for, in one batch. */
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one referral file is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateReferralItemRequest)
  public readonly files!: CreateReferralItemRequest[];

  /** Optional target extraction schema ID override, shared across the whole batch. Falls back to the clinic's default. */
  @IsOptional()
  @IsUUID()
  public readonly extractionSchemaId?: string | null;
}

export class ReferralDto {
  /** Unique referral ID (UUID). */
  public readonly id!: string;

  /** Owning clinic ID (UUID). */
  public readonly clinicId!: string;

  /** Original uploaded file name. */
  public readonly fileName!: string;

  /** `null` until extraction resolves a patient. */
  public readonly patientName!: string | null;

  /** Current lifecycle status. */
  public readonly status!: string;

  /** Resolved extraction schema ID, or `null` for the default LLM schema. */
  public readonly extractionSchemaId!: string | null;

  /** S3 bucket the referral PDF is (or will be) stored in. */
  public readonly s3Bucket!: string;

  /** S3 object key the referral PDF is (or will be) stored at. */
  public readonly s3Key!: string;

  /** Creation timestamp. */
  public readonly createdAt!: Date;

  /** Last update timestamp. */
  public readonly updatedAt!: Date;

  public static fromDomain(referral: Referral): ReferralDto {
    return {
      id: referral.id,
      clinicId: referral.clinicId.value,
      fileName: referral.fileName,
      patientName: referral.patientName,
      status: referral.status.value,
      extractionSchemaId: referral.extractionSchemaId?.value ?? null,
      s3Bucket: process.env.S3_BUCKET_NAME ?? 'plena-referrals',
      s3Key: `referrals/${referral.clinicId.value}/${referral.id}.pdf`,
      createdAt: referral.createdAt,
      updatedAt: referral.updatedAt,
    };
  }
}

export class PresignedUploadDto {
  /** Short-lived presigned S3 PUT URL to upload the referral PDF to. */
  public readonly url!: string;

  /** When the presigned URL expires. */
  public readonly expiresAt!: Date;
}

export class CreateReferralResponseDto {
  /** The newly created referral, in `AWAITING_UPLOAD` status. */
  public readonly referral!: ReferralDto;

  /** Presigned S3 upload slot for the referral PDF. */
  public readonly upload!: PresignedUploadDto;

  public static fromDomain(
    result: ReferralWithPresignedUpload,
  ): CreateReferralResponseDto {
    return {
      referral: ReferralDto.fromDomain(result.referral),
      upload: {
        url: result.upload.url,
        expiresAt: result.upload.expiresAt,
      },
    };
  }
}

export class BoundingBoxDto {
  /** Normalized minimum X coordinate (0-1000). */
  public readonly xmin!: number;

  /** Normalized minimum Y coordinate (0-1000). */
  public readonly ymin!: number;

  /** Normalized maximum X coordinate (0-1000). */
  public readonly xmax!: number;

  /** Normalized maximum Y coordinate (0-1000). */
  public readonly ymax!: number;
}

export class ExtractedFieldDto {
  /** Schema key identifying the extracted field (e.g. `patient_name`). */
  public readonly key!: string;

  /** Human-readable label for the extracted field. */
  public readonly label!: string;

  /** Extracted text value. */
  public readonly value!: string;

  /** 1-indexed page number in PDF document. */
  public readonly pageNumber!: number;

  /** Spatial bounding box used to highlight the value on the PDF page. */
  public readonly boundingBox!: BoundingBoxDto | null;
}

export class UpdateReferralRequest {
  /** Updated payload of extracted fields corrected by staff user. */
  public readonly extractedPayload!: ExtractedFieldDto[];
}

export class ReferralListItemDto {
  /** Unique referral ID (UUID). */
  public readonly id!: string;

  /** Original uploaded file name. */
  public readonly fileName!: string;

  /** `null` until extraction resolves a patient. */
  public readonly patientName!: string | null;

  /** Current lifecycle status. */
  public readonly status!: string;

  /** Resolved extraction schema ID, or `null` for the default LLM schema. */
  public readonly extractionSchemaId!: string | null;

  /** Schema version behind `extractionSchemaId`, for the dashboard label. */
  public readonly extractionSchemaVersion!: number | null;

  /** Populated when the referral FAILED or was REJECTED. */
  public readonly errorMessage!: string | null;

  /** Extracted fields for the review UI, with spatial bounding boxes. */
  public readonly extractedPayload!: ExtractedFieldDto[];

  /** Short-lived presigned S3 GET URL for the source PDF, refreshed per serve. */
  public readonly documentUrl!: string;

  /** ISO-8601 creation timestamp. */
  public readonly createdAt!: string;

  /** ISO-8601 last-update timestamp. */
  public readonly updatedAt!: string;

  public static fromReadModel(view: ReferralListItemView): ReferralListItemDto {
    return {
      id: view.id,
      fileName: view.fileName,
      patientName: view.patientName,
      status: view.status,
      extractionSchemaId: view.extractionSchemaId,
      extractionSchemaVersion: view.extractionSchemaVersion,
      errorMessage: view.errorMessage,
      extractedPayload: view.extractedPayload,
      documentUrl: view.documentUrl,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    };
  }
}

export class ListReferralsQueryDto {
  /**
   * Page number for pagination (starts at 1).
   * @example 1
   */
  public readonly page?: number;

  /**
   * Page size limit (maximum 100).
   * @example 20
   */
  public readonly limit?: number;
}
