import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ApplicationService } from '../../../application/application.service';
import { NotImplementedError } from '../../../application/errors/not-implemented.error';
import { TokenClaims } from '../../../application/ports/token.port';
import { Paginated } from '../../../application/ports/referral-repository.port';
import { ExtractionSchema } from '../../../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../../../domain/referral/referral.aggregate';
import { ClinicId } from '../../../domain/shared/ids/clinic-id.value-object';
import { ClinicDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateExtractionSchemaRequest } from './dto/create-extraction-schema.request.dto';
import { CreateReferralRequest } from './dto/create-referral.request.dto';
import { ListReferralsQueryDto } from './dto/list-referrals.query.dto';
import { UpdateReferralRequest } from './dto/update-referral.request.dto';

interface AuthenticatedRequest extends Request {
  user: TokenClaims;
}

@ApiBearerAuth('JWT-auth')
@Controller()
export class ClinicsController {
  public constructor(
    private readonly applicationService: ApplicationService,
  ) {}

  @ApiTags('Clinics')
  @UseGuards(JwtAuthGuard)
  @Get('clinics/me')
  @ApiOperation({ summary: 'Get current authenticated clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile details', type: ClinicDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async me(@Req() req: AuthenticatedRequest): Promise<ClinicDto> {
    const clinicId = ClinicId.from(req.user.clinicId);
    const clinic = await this.applicationService.getClinic(clinicId);
    return ClinicDto.fromDomain(clinic);
  }

  @ApiTags('Extraction Schemas')
  @UseGuards(JwtAuthGuard)
  @Post('extraction-schemas')
  @ApiOperation({ summary: 'Publish a new custom extraction schema version' })
  @ApiResponse({ status: 201, description: 'Extraction schema published' })
  public createSchema(
    @Body() body: CreateExtractionSchemaRequest,
  ): Promise<ExtractionSchema> {
    void body;
    throw new NotImplementedError('ClinicsController.createSchema');
  }

  @ApiTags('Extraction Schemas')
  @UseGuards(JwtAuthGuard)
  @Get('extraction-schemas')
  @ApiOperation({ summary: 'List all extraction schema versions for authenticated clinic' })
  @ApiResponse({ status: 200, description: 'List of extraction schema versions' })
  public listSchemas(): Promise<ExtractionSchema[]> {
    throw new NotImplementedError('ClinicsController.listSchemas');
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Post('referrals')
  @ApiOperation({ summary: 'Create new referral and issue presigned S3 upload URL' })
  @ApiResponse({ status: 201, description: 'Referral created and presigned S3 URL issued' })
  public createReferral(
    @Body() body: CreateReferralRequest,
  ): Promise<Referral> {
    void body;
    throw new NotImplementedError('ClinicsController.createReferral');
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Get('referrals')
  @ApiOperation({ summary: 'List paginated referrals for authenticated clinic' })
  @ApiResponse({ status: 200, description: 'Paginated list of referrals' })
  public listReferrals(
    @Query() query: ListReferralsQueryDto,
  ): Promise<Paginated<Referral>> {
    void query;
    throw new NotImplementedError('ClinicsController.listReferrals');
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Get('referrals/:id')
  @ApiOperation({ summary: 'Get referral detail by ID with extracted payload and bounding boxes' })
  @ApiResponse({ status: 200, description: 'Referral detail record' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  public getReferral(@Param('id') id: string): Promise<Referral> {
    void id;
    throw new NotImplementedError('ClinicsController.getReferral');
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Patch('referrals/:id')
  @ApiOperation({ summary: 'Correct/Update extracted referral field values and bounding boxes' })
  @ApiResponse({ status: 200, description: 'Referral record updated' })
  public updateReferral(
    @Param('id') id: string,
    @Body() body: UpdateReferralRequest,
  ): Promise<Referral> {
    void id;
    void body;
    throw new NotImplementedError('ClinicsController.updateReferral');
  }

  @ApiTags('Referrals')
  @Sse('referrals/:id/stream')
  @ApiOperation({ summary: 'Real-time Server-Sent Events (SSE) status stream for processing referral' })
  @ApiResponse({ status: 200, description: 'SSE event stream connection established' })
  public streamReferral(@Param('id') id: string): Observable<MessageEvent> {
    void id;
    throw new NotImplementedError('ClinicsController.streamReferral');
  }
}
