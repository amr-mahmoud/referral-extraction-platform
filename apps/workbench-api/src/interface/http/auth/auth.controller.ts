import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ClinicLoginResult,
  ClinicService,
} from '../../../application/clinic/clinic.service';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import { LoginRequest } from './dto/login.request.dto';
import { SignupRequest } from './dto/signup.request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly clinicService: ClinicService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new clinic account' })
  @ApiResponse({ status: 201, description: 'Clinic registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate username' })
  public signup(@Body() body: SignupRequest): Promise<Clinic> {
    return this.clinicService.signup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate clinic and receive JWT bearer token' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid username or password' })
  public login(@Body() body: LoginRequest): Promise<ClinicLoginResult> {
    return this.clinicService.login(body);
  }
}
