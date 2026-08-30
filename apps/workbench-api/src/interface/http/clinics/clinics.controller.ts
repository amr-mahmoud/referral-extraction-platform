import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationService } from '../../../application/application.service';
import { normalizeExtractionSchemaFields } from '../dto/extraction-schema-input.mapper';
import {
  ClinicDto,
  CreateExtractionSchemaRequest,
  CreateReferralResponseDto,
  CreateReferralsRequest,
  ExtractionSchemaDto,
  ReferralListItemDto,
} from '../dto/index.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../types';

/** SSE event name — the wire contract with the frontend's `useReferralStatusStream`. */
const REFERRAL_CHANGED_EVENT_NAME = 'referral-changed';

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
    const clinicId = req.user.clinicId;
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
    const clinicId = req.user.clinicId;
    const schema = await this.applicationService.createExtractionSchema({
      clinicId,
      title: body.title,
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
    const clinicId = req.user.clinicId;
    const schemas =
      await this.applicationService.listExtractionSchemas(clinicId);
    return schemas.map((schema) => ExtractionSchemaDto.fromDomain(schema));
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Post('referrals')
  @ApiOperation({
    summary: 'Create new referrals in batch and issue presigned S3 upload URLs',
  })
  @ApiResponse({
    status: 201,
    description:
      'Referrals created and presigned S3 URLs issued, in request order',
    type: [CreateReferralResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Extraction schema not found' })
  public async createNewReferralsWithAttachedPresignedUrls(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateReferralsRequest,
  ): Promise<CreateReferralResponseDto[]> {
    const clinicId = req.user.clinicId;
    const results =
      await this.applicationService.createNewReferralsWithAttachedPresignedUrls(
        {
          clinicId,
          files: body.files.map((file) => ({
            fileName: file.fileName,
            patientName: file.patientName,
          })),
          extractionSchemaId: body.extractionSchemaId ?? null,
        },
      );

    return results.map((result) =>
      CreateReferralResponseDto.fromDomain(result),
    );
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Get('referrals')
  @ApiOperation({
    summary: 'List all referrals for the authenticated clinic',
    description:
      'Served cache-aside from the per-clinic Redis index, falling back to Postgres on a miss.',
  })
  @ApiResponse({
    status: 200,
    description: 'Referrals for the clinic, newest first',
    type: [ReferralListItemDto],
  })
  public async listReferrals(
    @Req() req: AuthenticatedRequest,
  ): Promise<ReferralListItemDto[]> {
    const clinicId = req.user.clinicId;
    const views = await this.applicationService.listClinicReferrals(clinicId);
    return views.map((view) => ReferralListItemDto.fromReadModel(view));
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Sse('referrals/stream')
  @ApiOperation({
    summary:
      'Server-Sent Events stream of referral changes for the authenticated clinic',
    description:
      'Design-doc step 9: a Postgres LISTEN/NOTIFY ping triggers a primary-key ' +
      'SELECT, which refreshes the Redis cache and pushes the full referral down ' +
      'this stream. The NOTIFY payload itself carries only ids and status — the ' +
      '8KB channel limit cannot hold an extracted payload.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  public streamClinicReferrals(
    @Req() req: AuthenticatedRequest,
  ): Observable<MessageEvent> {
    return this.applicationService
      .observeClinicReferralChanges(req.user.clinicId)
      .pipe(
        map((referral) => ({
          type: REFERRAL_CHANGED_EVENT_NAME,
          data: ReferralListItemDto.fromReadModel(referral),
        })),
      );
  }

  @ApiTags('Referrals')
  @UseGuards(JwtAuthGuard)
  @Get('referrals/:id')
  @ApiOperation({
    summary:
      'Get one referral by ID, with extracted payload and bounding boxes',
    description:
      "Served cache-aside from the referral's own Redis hash, falling back " +
      'to Postgres on a miss — the single-id form of `GET /referrals`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Referral detail record',
    type: ReferralListItemDto,
  })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  public async getReferral(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ReferralListItemDto> {
    const clinicId = req.user.clinicId;
    const view = await this.applicationService.getClinicReferral(clinicId, id);
    return ReferralListItemDto.fromReadModel(view);
  }
}
