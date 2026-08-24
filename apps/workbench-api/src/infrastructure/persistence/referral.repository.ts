import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import {
  ListReferralOptions,
  Paginated,
  ReferralRepositoryPort,
} from '../../application/ports/referral-repository.port';
import { Referral } from '../../domain/referral/referral.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaReferralRepository implements ReferralRepositoryPort {
  public constructor(private readonly prismaService: PrismaService) {}

  public findById(id: ReferralId): Promise<Referral | null> {
    void id;
    throw new NotImplementedError('PrismaReferralRepository.findById');
  }

  public findByIdForClinic(
    id: ReferralId,
    clinicId: ClinicId,
  ): Promise<Referral | null> {
    void id;
    void clinicId;
    throw new NotImplementedError('PrismaReferralRepository.findByIdForClinic');
  }

  public listByClinicId(
    clinicId: ClinicId,
    options: ListReferralOptions,
  ): Promise<Paginated<Referral>> {
    void clinicId;
    void options;
    throw new NotImplementedError('PrismaReferralRepository.listByClinicId');
  }

  public save(referral: Referral): Promise<Referral> {
    void referral;
    throw new NotImplementedError('PrismaReferralRepository.save');
  }
}
