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
import { Observable } from 'rxjs';
import { ClinicService } from '../../../application/clinic/clinic.service';
import { NotImplementedError } from '../../../application/errors/not-implemented.error';
import { ExtractionSchemaService } from '../../../application/extraction-schema/extraction-schema.service';
import { Paginated } from '../../../application/ports/referral-repository.port';
import { ReferralService } from '../../../application/referral/referral.service';
import { Clinic } from '../../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../../../domain/referral/referral.aggregate';
import type { CreateExtractionSchemaRequest } from './dto/create-extraction-schema.request.dto';
import type { CreateReferralRequest } from './dto/create-referral.request.dto';
import type { ListReferralsQueryDto } from './dto/list-referrals.query.dto';
import type { UpdateReferralRequest } from './dto/update-referral.request.dto';

@Controller()
export class ClinicsController {
  public constructor(
    private readonly clinicService: ClinicService,
    private readonly extractionSchemaService: ExtractionSchemaService,
    private readonly referralService: ReferralService,
  ) {}

  @Get('clinics/me')
  public me(): Promise<Clinic> {
    throw new NotImplementedError('ClinicsController.me');
  }

  @Post('extraction-schemas')
  public createSchema(
    @Body() body: CreateExtractionSchemaRequest,
  ): Promise<ExtractionSchema> {
    void body;
    throw new NotImplementedError('ClinicsController.createSchema');
  }

  @Get('extraction-schemas')
  public listSchemas(): Promise<ExtractionSchema[]> {
    throw new NotImplementedError('ClinicsController.listSchemas');
  }

  @Post('referrals')
  public createReferral(
    @Body() body: CreateReferralRequest,
  ): Promise<Referral> {
    void body;
    throw new NotImplementedError('ClinicsController.createReferral');
  }

  @Get('referrals')
  public listReferrals(
    @Query() query: ListReferralsQueryDto,
  ): Promise<Paginated<Referral>> {
    void query;
    throw new NotImplementedError('ClinicsController.listReferrals');
  }

  @Get('referrals/:id')
  public getReferral(@Param('id') id: string): Promise<Referral> {
    void id;
    throw new NotImplementedError('ClinicsController.getReferral');
  }

  @Patch('referrals/:id')
  public updateReferral(
    @Param('id') id: string,
    @Body() body: UpdateReferralRequest,
  ): Promise<Referral> {
    void id;
    void body;
    throw new NotImplementedError('ClinicsController.updateReferral');
  }

  @Sse('referrals/:id/stream')
  public streamReferral(@Param('id') id: string): Observable<MessageEvent> {
    void id;
    throw new NotImplementedError('ClinicsController.streamReferral');
  }
}
