import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralRequest {
  @ApiProperty({
    description: 'Name of the patient associated with referral',
    example: 'Jane Doe',
  })
  public readonly patientName!: string;

  @ApiPropertyOptional({
    description: 'Optional target extraction schema ID override',
    example: 'sch_987654321',
    nullable: true,
  })
  public readonly extractionSchemaId?: string | null;
}
