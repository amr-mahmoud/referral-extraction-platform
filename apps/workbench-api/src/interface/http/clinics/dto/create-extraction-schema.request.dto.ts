import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../../../../domain/extraction-schema/field-definition.value-object';

export class SchemaFieldDefinitionDto {
  @ApiProperty({
    description: 'Unique JSON property key for extracted value',
    example: 'patient_dob',
  })
  public readonly key!: string;

  @ApiProperty({
    description: 'Human-readable label displayed in UI workbench',
    example: 'Patient Date of Birth',
  })
  public readonly label!: string;

  @ApiProperty({
    description: 'Field data type',
    enum: FieldType,
    example: FieldType.DATE,
  })
  public readonly type!: FieldType;

  @ApiPropertyOptional({
    description: 'Optional guidance prompt for Gemini LLM extractor',
    example: 'Look for DOB or Date of Birth format YYYY-MM-DD',
    nullable: true,
  })
  public readonly description?: string | null;
}

export class CreateExtractionSchemaRequest {
  @ApiProperty({
    description: 'Array of custom field definitions for LLM extraction',
    type: [SchemaFieldDefinitionDto],
  })
  public readonly fields!: SchemaFieldDefinitionDto[];
}
