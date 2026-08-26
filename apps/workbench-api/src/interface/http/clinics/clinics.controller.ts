import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { Request } from 'express';
import { Observable } from 'rxjs';
import { concatMap, filter, map } from 'rxjs/operators';
import { ApplicationService } from '../../../application/application.service';
import { NotImplementedError } from '../../../application/errors/not-implemented.error';
import { TokenClaims } from '../../../application/ports/token.port';
import { PostgresListenService } from '../../../infrastructure/notifications/postgres-listen.service';
import { Referral } from '../../../domain/referral/referral.aggregate';
import { ClinicId } from '../../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../../domain/shared/ids/extraction-schema-id.value-object';
import { normalizeExtractionSchemaFields } from '../dto/extraction-schema-input.mapper';
import {
  ClinicDto,
  CreateExtractionSchemaRequest,
  CreateReferralResponseDto,
  CreateReferralsRequest,
  ExtractionSchemaDto,
  ReferralListItemDto,
  UpdateReferralRequest,
} from '../dto/index.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: TokenClaims;
}

@ApiBearerAuth('JWT-auth')
@Controller()
export class ClinicsController {
  public constructor(
    private readonly applicationService: ApplicationService,
    private readonly postgresListenService: PostgresListenService,
  ) {}

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
    const clinicId = ClinicId.from(req.user.clinicId);
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
    const clinicId = ClinicId.from(req.user.clinicId);
    const results =
      await this.applicationService.createNewReferralsWithAttachedPresignedUrls(
        {
          clinicId,
          files: body.files.map((file) => ({
            fileName: file.fileName,
            patientName: file.patientName,
          })),
          extractionSchemaId: body.extractionSchemaId
            ? ExtractionSchemaId.from(body.extractionSchemaId)
            : null,
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
    const clinicId = ClinicId.from(req.user.clinicId);
    const views =
      await this.applicationService.listReferralViewsByClinic(clinicId);
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
    const clinicId = req.user.clinicId;

    return this.postgresListenService.observeReferralChanges().pipe(
      // Tenant isolation on the stream: NOTIFY is database-wide, so every
      // connected clinic sees every ping and must filter to its own before
      // the fetch, not after.
      filter((notification) => notification.clinicId === clinicId),
      concatMap(async (notification) => {
        const view = await this.applicationService.refreshReferralViewCache(
          notification.referralId,
        );
        return view;
      }),
      filter((view): view is NonNullable<typeof view> => view !== null),
      map((view) => ({
        type: 'referral-changed',
        data: ReferralListItemDto.fromReadModel(view),
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
    const clinicId = ClinicId.from(req.user.clinicId);
    const view = await this.applicationService.getReferralViewByClinic(
      clinicId,
      id,
    );
    return ReferralListItemDto.fromReadModel(view);
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
