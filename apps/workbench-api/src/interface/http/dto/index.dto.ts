import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import { FieldType } from '../../../domain/extraction-schema/field-definition.value-object';

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

export class SchemaFieldDefinitionDto {
  /** Unique JSON property key for extracted value. */
  public readonly key!: string;

  /** Human-readable label displayed in UI workbench. */
  public readonly label!: string;

  /** Field data type. */
  public readonly type!: FieldType;

  /** Optional guidance prompt for Gemini LLM extractor. */
  public readonly description?: string | null;
}

export class CreateExtractionSchemaRequest {
  /** Array of custom field definitions for LLM extraction. */
  public readonly fields!: SchemaFieldDefinitionDto[];
}

export class CreateReferralRequest {
  /** Name of the patient associated with referral. */
  public readonly patientName!: string;

  /** Optional target extraction schema ID override. */
  public readonly extractionSchemaId?: string | null;
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
