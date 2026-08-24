import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ClinicLoginResult,
  ClinicService,
} from '../../../application/clinic/clinic.service';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import type { LoginRequest } from './dto/login.request.dto';
import type { SignupRequest } from './dto/signup.request.dto';

@Controller('auth')
export class AuthController {
  public constructor(private readonly clinicService: ClinicService) {}

  @Post('signup')
  public signup(@Body() body: SignupRequest): Promise<Clinic> {
    return this.clinicService.signup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() body: LoginRequest): Promise<ClinicLoginResult> {
    return this.clinicService.login(body);
  }
}
