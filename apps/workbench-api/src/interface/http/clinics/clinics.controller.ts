import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ClinicService } from '../../../application/clinic/clinic.service';
import { NotImplementedError } from '../../../application/errors/not-implemented.error';
import { ExtractionSchemaService } from '../../../application/extraction-schema/extraction-schema.service';
import { Paginated } from '../../../application/ports/referral-repository.port';
import { ReferralService } from '../../../application/referral/referral.service';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../../../domain/referral/referral.aggregate';
import { CreateExtractionSchemaRequest } from './dto/create-extraction-schema.request.dto';
import { CreateReferralRequest } from './dto/create-referral.request.dto';
import { ListReferralsQueryDto } from './dto/list-referrals.query.dto';
import { UpdateReferralRequest } from './dto/update-referral.request.dto';

@ApiBearerAuth('JWT-auth')
@Controller()
export class ClinicsController {
  public constructor(
    private readonly clinicService: ClinicService,
    private readonly extractionSchemaService: ExtractionSchemaService,
    private readonly referralService: ReferralService,
  ) {}

  @ApiTags('Clinics')
  @Get('clinics/me')
  @ApiOperation({ summary: 'Get current authenticated clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public me(): Promise<Clinic> {
    throw new NotImplementedError('ClinicsController.me');
  }

  @ApiTags('Extraction Schemas')
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
  @Get('extraction-schemas')
  @ApiOperation({ summary: 'List all extraction schema versions for authenticated clinic' })
  @ApiResponse({ status: 200, description: 'List of extraction schema versions' })
  public listSchemas(): Promise<ExtractionSchema[]> {
    throw new NotImplementedError('ClinicsController.listSchemas');
  }

  @ApiTags('Referrals')
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
  @Get('referrals/:id')
  @ApiOperation({ summary: 'Get referral detail by ID with extracted payload and bounding boxes' })
  @ApiResponse({ status: 200, description: 'Referral detail record' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  public getReferral(@Param('id') id: string): Promise<Referral> {
    void id;
    throw new NotImplementedError('ClinicsController.getReferral');
  }

  @ApiTags('Referrals')
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
