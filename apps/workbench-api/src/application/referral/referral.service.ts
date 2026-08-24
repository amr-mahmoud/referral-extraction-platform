import { Inject, Injectable } from '@nestjs/common';
import { ExtractedField } from '../../domain/referral/extracted-field.value-object';
import { Referral } from '../../domain/referral/referral.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';
import { NotImplementedError } from '../errors/not-implemented.error';
import {
  Paginated,
  REFERRAL_REPOSITORY_PORT,
  type ReferralRepositoryPort,
} from '../ports/referral-repository.port';
import { STORAGE_PORT, type StoragePort } from '../ports/storage.port';

export interface CreateReferralCommand {
  clinicId: ClinicId;
  patientName: string;
  extractionSchemaId?: ExtractionSchemaId | null;
}

export interface ListReferralsQuery {
  clinicId: ClinicId;
  page: number;
  limit: number;
}

export interface CorrectReferralCommand {
  clinicId: ClinicId;
  referralId: ReferralId;
  extractedPayload: ExtractedField[];
}

@Injectable()
export class ReferralService {
  public constructor(
    @Inject(REFERRAL_REPOSITORY_PORT)
    private readonly referralRepository: ReferralRepositoryPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  public create(command: CreateReferralCommand): Promise<Referral> {
    void command;
    throw new NotImplementedError('ReferralService.create');
  }

  public listByClinic(query: ListReferralsQuery): Promise<Paginated<Referral>> {
    void query;
    throw new NotImplementedError('ReferralService.listByClinic');
  }

  public getByClinic(
    clinicId: ClinicId,
    referralId: ReferralId,
  ): Promise<Referral> {
    void clinicId;
    void referralId;
    throw new NotImplementedError('ReferralService.getByClinic');
  }

  public correct(command: CorrectReferralCommand): Promise<Referral> {
    void command;
    throw new NotImplementedError('ReferralService.correct');
  }
}
