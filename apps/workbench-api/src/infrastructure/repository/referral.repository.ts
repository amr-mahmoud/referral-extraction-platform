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
import type { ReferralView } from '../../application/read-models/referral-view.read-model';

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

  public async saveReferrals(referrals: Referral[]): Promise<Referral[]> {
    const rows = await this.prisma.$transaction(
      referrals.map((referral) => {
        const data = ReferralMapper.toPersistence(referral);
        return this.prisma.referral.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        });
      }),
    );

    return rows.map((row) => ReferralMapper.toDomain(row));
  }

  // ── Read-model queries ───────────────────────────────────────────────

  public async findReferralViewsByClinicId(
    clinicId: ClinicId,
  ): Promise<ReferralView[]> {
    const rows = await this.prisma.referral.findMany({
      where: { clinicId: clinicId.value },
      orderBy: { createdAt: 'desc' },
      select: REFERRAL_VIEW_SELECT,
    });
    return rows.map(toReferralView);
  }

  public async findReferralViewsByIds(
    referralIds: string[],
  ): Promise<ReferralView[]> {
    if (referralIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.referral.findMany({
      where: { id: { in: referralIds } },
      orderBy: { createdAt: 'desc' },
      select: REFERRAL_VIEW_SELECT,
    });
    return rows.map(toReferralView);
  }

  public async findAllReferralViews(): Promise<ReferralView[]> {
    const rows = await this.prisma.referral.findMany({
      orderBy: { createdAt: 'desc' },
      select: REFERRAL_VIEW_SELECT,
    });
    return rows.map(toReferralView);
  }
}

/**
 * One `select` shared by every read-model query so the three can never drift
 * apart — a field added here reaches the list, the backfill, and the dev
 * warm-up at once. The nested `extractionSchema` join is what supplies the
 * dashboard's "Custom schema v3" label.
 */
const REFERRAL_VIEW_SELECT = {
  id: true,
  clinicId: true,
  fileName: true,
  patientName: true,
  status: true,
  extractionSchemaId: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  extractionSchema: { select: { version: true } },
} as const;

interface ReferralViewRow {
  id: string;
  clinicId: string;
  fileName: string;
  patientName: string | null;
  status: string;
  extractionSchemaId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  extractionSchema: { version: number } | null;
}

function toReferralView(row: ReferralViewRow): ReferralView {
  return {
    id: row.id,
    clinicId: row.clinicId,
    fileName: row.fileName,
    patientName: row.patientName,
    status: row.status,
    extractionSchemaId: row.extractionSchemaId,
    extractionSchemaVersion: row.extractionSchema?.version ?? null,
    errorMessage: row.errorMessage,
    // ISO strings, not Date — this shape is JSON.stringify'd straight into
    // Redis and must survive the round-trip unchanged.
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
