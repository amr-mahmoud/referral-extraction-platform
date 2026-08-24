import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'Clinic username for authentication',
    example: 'dr_smith_clinic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  public readonly username!: string;

  @ApiProperty({
    description: 'Clinic account password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  public readonly password!: string;
}
