import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BoundingBoxDto {
  @ApiProperty({ description: 'Normalized minimum X coordinate (0-1000)', example: 120 })
  public readonly xmin!: number;

  @ApiProperty({ description: 'Normalized minimum Y coordinate (0-1000)', example: 340 })
  public readonly ymin!: number;

  @ApiProperty({ description: 'Normalized maximum X coordinate (0-1000)', example: 480 })
  public readonly xmax!: number;

  @ApiProperty({ description: 'Normalized maximum Y coordinate (0-1000)', example: 390 })
  public readonly ymax!: number;
}

export class ExtractedFieldDto {
  @ApiProperty({ description: 'Extracted text value', example: '1985-04-12' })
  public readonly value!: string;

  @ApiProperty({ description: '1-indexed page number in PDF document', example: 1 })
  public readonly pageNumber!: number;

  @ApiPropertyOptional({
    description: 'Spatial bounding box bounding highlight box on PDF page',
    type: BoundingBoxDto,
    nullable: true,
  })
  public readonly boundingBox!: BoundingBoxDto | null;
}

export class UpdateReferralRequest {
  @ApiProperty({
    description: 'Updated payload of extracted fields corrected by staff user',
    type: [ExtractedFieldDto],
  })
  public readonly extractedPayload!: ExtractedFieldDto[];
}
