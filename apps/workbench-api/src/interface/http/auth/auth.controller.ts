import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApplicationService } from '../../../application/application.service';
import { AuthResponseDto, ClinicDto } from './dto/auth-response.dto';
import { LoginRequest } from './dto/login.request.dto';
import { SignupRequest } from './dto/signup.request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly applicationService: ApplicationService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new clinic account' })
  @ApiResponse({
    status: 201,
    description: 'Clinic registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or password requirements not met' })
  @ApiResponse({ status: 409, description: 'Username is already taken' })
  public async signup(@Body() body: SignupRequest): Promise<AuthResponseDto> {
    const result = await this.applicationService.signup(body);
    return {
      clinic: ClinicDto.fromDomain(result.clinic),
      token: result.token,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate clinic and receive JWT bearer token' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid username or password' })
  public async login(@Body() body: LoginRequest): Promise<AuthResponseDto> {
    const result = await this.applicationService.login(body);
    return {
      clinic: ClinicDto.fromDomain(result.clinic),
      token: result.token,
    };
  }
}
