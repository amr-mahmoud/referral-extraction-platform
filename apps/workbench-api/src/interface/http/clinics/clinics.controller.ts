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
import { Referral } from '../../../domain/referral/referral.aggregate';
import { ClinicId } from '../../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../../domain/shared/ids/extraction-schema-id.value-object';
import { normalizeExtractionSchemaFields } from '../dto/extraction-schema-input.mapper';
import {
  ClinicDto,
  CreateExtractionSchemaRequest,
  CreateReferralRequest,
  CreateReferralResponseDto,
  ExtractionSchemaDto,
  ListReferralsQueryDto,
  UpdateReferralRequest,
} from '../dto/index.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: TokenClaims;
}

@ApiBearerAuth('JWT-auth')
@Controller()
export class ClinicsController {
  public constructor(private readonly applicationService: ApplicationService) {}

  @ApiTags('Clinics')
  @UseGuards(JwtAuthGuard)
  @Get('clinics/me')
  @ApiOperation({ summary: 'Get current authenticated clinic profile' })
  @ApiResponse({
    status: 200,
    description: 'Clinic profile details',
    type: ClinicDto,
  })
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
  @ApiResponse({
    status: 201,
    description: 'Extraction schema published',
    type: ExtractionSchemaDto,
  })
  public async createSchema(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateExtractionSchemaRequest,
  ): Promise<ExtractionSchemaDto> {
    const clinicId = ClinicId.from(req.user.clinicId);
    const schema = await this.applicationService.createExtractionSchema({
      clinicId,
      fields: normalizeExtractionSchemaFields(body.fields),
    });
    return ExtractionSchemaDto.fromDomain(schema);
  }

  @ApiTags('Extraction Schemas')
  @UseGuards(JwtAuthGuard)
  @Get('extraction-schemas')
  @ApiOperation({
    summary: 'List all extraction schema versions for authenticated clinic',
  })
  @ApiResponse({
    status: 200,
    description: 'List of extraction schema versions',
    type: [ExtractionSchemaDto],
  })
  public async listSchemas(
    @Req() req: AuthenticatedRequest,
  ): Promise<ExtractionSchemaDto[]> {
    const clinicId = ClinicId.from(req.user.clinicId);
    const schemas =
      await this.applicationService.listExtractionSchemas(clinicId);
    return schemas.map((schema) => ExtractionSchemaDto.fromDomain(schema));
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Post('referrals')
  @ApiOperation({
    summary: 'Create new referral and issue presigned S3 upload URL',
  })
  @ApiResponse({
    status: 201,
    description: 'Referral created and presigned S3 URL issued',
    type: CreateReferralResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Extraction schema not found' })
  public async createNewReferralWithAttachedPresignedUrl(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateReferralRequest,
  ): Promise<CreateReferralResponseDto> {
    const clinicId = ClinicId.from(req.user.clinicId);
    const result =
      await this.applicationService.createNewReferralWithAttachedPresignedUrl({
        clinicId,
        fileName: body.fileName,

        extractionSchemaId: body.extractionSchemaId
          ? ExtractionSchemaId.from(body.extractionSchemaId)
          : null,
      });
    return CreateReferralResponseDto.fromDomain(result);
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Get('referrals')
  @ApiOperation({
    summary: 'List paginated referrals for authenticated clinic',
  })
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
  @ApiOperation({
    summary:
      'Get referral detail by ID with extracted payload and bounding boxes',
  })
  @ApiResponse({ status: 200, description: 'Referral detail record' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  public getReferral(@Param('id') id: string): Promise<Referral> {
    void id;
    throw new NotImplementedError('ClinicsController.getReferral');
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Patch('referrals/:id')
  @ApiOperation({
    summary:
      'Correct/Update extracted referral field values and bounding boxes',
  })
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
  @ApiOperation({
    summary:
      'Real-time Server-Sent Events (SSE) status stream for processing referral',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE event stream connection established',
  })
  public streamReferral(@Param('id') id: string): Observable<MessageEvent> {
    void id;
    throw new NotImplementedError('ClinicsController.streamReferral');
  }
}
