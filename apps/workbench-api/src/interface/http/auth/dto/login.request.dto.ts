import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    description: 'Clinic username for authentication',
    example: 'dr_smith_clinic',
  })
  public readonly username!: string;

  @ApiProperty({
    description: 'Clinic account password',
    example: 'SecurePassword123!',
  })
  public readonly password!: string;
}
