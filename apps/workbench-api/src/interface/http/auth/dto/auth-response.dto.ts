import { ApiProperty } from '@nestjs/swagger';
import { Clinic } from '../../../../domain/clinic/clinic.aggregate';

export class ClinicDto {
  @ApiProperty({
    description: 'Unique clinic ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  public readonly id!: string;

  @ApiProperty({
    description: 'Full name or title of the clinic',
    example: 'Smith Medical Practice',
  })
  public readonly clinicName!: string;

  @ApiProperty({
    description: 'Unique clinic username',
    example: 'dr_smith_clinic',
  })
  public readonly username!: string;

  @ApiProperty({
    description: 'Default extraction schema ID if configured',
    nullable: true,
    example: null,
  })
  public readonly defaultExtractionSchemaId!: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-08-24T20:00:00.000Z',
  })
  public readonly createdAt!: Date;

  public static fromDomain(clinic: Clinic): ClinicDto {
    return {
      id: clinic.id.value,
      clinicName: clinic.clinicName,
      username: clinic.username,
      defaultExtractionSchemaId: clinic.defaultExtractionSchemaId?.value ?? null,
      createdAt: clinic.createdAt,
    };
  }
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Sanitized clinic profile information',
    type: ClinicDto,
  })
  public readonly clinic!: ClinicDto;

  @ApiProperty({
    description: 'Signed JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  public readonly token!: string;
}
