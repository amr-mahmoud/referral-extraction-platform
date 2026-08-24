import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListReferralsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (starts at 1)',
    example: 1,
    default: 1,
  })
  public readonly page?: number;

  @ApiPropertyOptional({
    description: 'Page size limit (maximum 100)',
    example: 20,
    default: 20,
  })
  public readonly limit?: number;
}
