import { ApiProperty } from '@nestjs/swagger';

export class SignupRequest {
  @ApiProperty({
    description: 'Full name or title of the clinic',
    example: 'Smith Medical Practice',
  })
  public readonly clinicName!: string;

  @ApiProperty({
    description: 'Unique clinic username for authentication',
    example: 'dr_smith_clinic',
  })
  public readonly username!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'SecurePassword123!',
  })
  public readonly password!: string;
}
