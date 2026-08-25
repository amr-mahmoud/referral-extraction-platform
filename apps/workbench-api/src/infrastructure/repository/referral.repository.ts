import { Injectable } from '@nestjs/common';
import {
  ListReferralOptions,
  Paginated,
  ReferralRepositoryPort,
} from '../../application/ports/referral-repository.port';
import { Referral } from '../../domain/referral/referral.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';
import { PrismaService } from './prisma.service';
import { ReferralMapper } from './referral.mapper';

@Injectable()
export class PrismaReferralRepository implements ReferralRepositoryPort {
  public constructor(private readonly prisma: PrismaService) {}

  public async findReferralById(id: ReferralId): Promise<Referral | null> {
    const row = await this.prisma.referral.findUnique({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return ReferralMapper.toDomain(row);
  }

  public async findReferralByIdForClinic(
    id: ReferralId,
    clinicId: ClinicId,
  ): Promise<Referral | null> {
    const row = await this.prisma.referral.findFirst({
      where: { id, clinicId: clinicId.value },
    });

    if (!row) {
      return null;
    }

    return ReferralMapper.toDomain(row);
  }

  public async findPaginatedReferralsByClinicId(
    clinicId: ClinicId,
    options: ListReferralOptions,
  ): Promise<Paginated<Referral>> {
    const skip = (options.page - 1) * options.limit;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.referral.findMany({
        where: { clinicId: clinicId.value },
        orderBy: { createdAt: 'desc' },
        skip,
        take: options.limit,
      }),
      this.prisma.referral.count({ where: { clinicId: clinicId.value } }),
    ]);

    return {
      items: rows.map((row) => ReferralMapper.toDomain(row)),
      total,
      page: options.page,
      limit: options.limit,
    };
  }

  public async saveReferral(referral: Referral): Promise<Referral> {
    const data = ReferralMapper.toPersistence(referral);

    const row = await this.prisma.referral.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    return ReferralMapper.toDomain(row);
  }
}
