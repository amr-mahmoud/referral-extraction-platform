import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class SignupRequest {
  @ApiProperty({
    description: 'Full name or title of the clinic',
    example: 'Smith Medical Practice',
  })
  @IsString()
  @IsNotEmpty({ message: 'Clinic name is required' })
  public readonly clinicName!: string;

  @ApiProperty({
    description: 'Unique clinic username for authentication (3-50 chars, letters/numbers/_)',
    example: 'dr_smith_clinic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Matches(/^[a-zA-Z0-9_]{3,50}$/, {
    message: 'Username must be 3-50 characters containing only letters, numbers, and underscores',
  })
  public readonly username!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  public readonly password!: string;
}
