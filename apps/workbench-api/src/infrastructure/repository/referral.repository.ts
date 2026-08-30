import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { REPOSITORY_ERROR } from '../../../libs/errors/repository-error-code.enum';
import { ReferralRepositoryPort } from '../../application/ports/referral-repository.port';
import { Referral } from '../../domain/referral/referral.aggregate';
import { RepositoryException } from '../errors/repository.exception';
import { PrismaService } from './prisma.service';
import { ReferralMapper } from './referral.mapper';
import type { ReferralData, ExtractedFieldView } from '../../application/types';
import type { CachedReferralRow } from './types';

@Injectable()
export class PrismaReferralRepository implements ReferralRepositoryPort {
  public constructor(private readonly prisma: PrismaService) {}

  public async findReferralById(id: string): Promise<ReferralData | null> {
    try {
      const row = await this.prisma.referral.findUnique({
        where: { id },
        select: CACHED_REFERRAL_SELECT,
      });

      if (!row) {
        return null;
      }

      return toDataReferral(row);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findReferralById',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async saveReferrals(referrals: Referral[]): Promise<Referral[]> {
    try {
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
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'saveReferrals',
        REPOSITORY_ERROR.DATABASE_TRANSACTION_FAILED,
      );
    }
  }

  public async deleteReferralsByIds(referralIds: string[]): Promise<void> {
    try {
      if (referralIds.length === 0) {
        return;
      }
      await this.prisma.referral.deleteMany({
        where: { id: { in: referralIds } },
      });
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'deleteReferralsByIds',
        REPOSITORY_ERROR.DATABASE_WRITE_FAILED,
      );
    }
  }

  public async findReferralsByClinicId(
    clinicId: string,
  ): Promise<ReferralData[]> {
    try {
      const rows = await this.prisma.referral.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        select: CACHED_REFERRAL_SELECT,
      });
      return rows.map(toDataReferral);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findReferralsByClinicId',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async findManyReferralsByIds(
    referralIds: string[],
  ): Promise<ReferralData[]> {
    try {
      if (referralIds.length === 0) {
        return [];
      }
      const rows = await this.prisma.referral.findMany({
        where: { id: { in: referralIds } },
        orderBy: { createdAt: 'desc' },
        select: CACHED_REFERRAL_SELECT,
      });
      return rows.map(toDataReferral);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findManyReferralsByIds',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async findAllReferrals(): Promise<ReferralData[]> {
    try {
      const rows = await this.prisma.referral.findMany({
        orderBy: { createdAt: 'desc' },
        select: CACHED_REFERRAL_SELECT,
      });
      return rows.map(toDataReferral);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findAllReferrals',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  private toRepositoryException(
    error: unknown,
    methodSrc: string,
    errorCode: REPOSITORY_ERROR,
  ): RepositoryException {
    if (error instanceof RepositoryException) {
      return error;
    }
    return new RepositoryException(
      errorCode,
      error instanceof Error ? error.message : String(error),
      PrismaReferralRepository.name,
      methodSrc,
    );
  }
}

/**
 * One `select` shared by every read-model query so the three can never drift
 * apart — a field added here reaches the list, the backfill, and the dev
 * warm-up at once. The nested `extractionSchema` join is what supplies the
 * dashboard's schema label (title, with `v{n}` as fallback).
 */
const CACHED_REFERRAL_SELECT = {
  id: true,
  clinicId: true,
  fileName: true,
  patientName: true,
  status: true,
  extractionSchemaId: true,
  errorMessage: true,
  extractedPayload: true,
  createdAt: true,
  updatedAt: true,
  extractionSchema: { select: { version: true, title: true } },
} as const;

/**
 * The `extractedPayload` JSONB column only ever holds the exact
 * `{key, label, value, pageNumber, boundingBox}` shape written by
 * `ReferralMapper.toPersistence`/the worker's normalizer, so a structural cast
 * here carries the same trust level the read model already applies to its other
 * primitives.
 */
function toExtractedFieldViews(raw: Prisma.JsonValue): ExtractedFieldView[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as unknown as ExtractedFieldView[];
}

function toDataReferral(row: CachedReferralRow): ReferralData {
  return {
    id: row.id,
    clinicId: row.clinicId,
    fileName: row.fileName,
    patientName: row.patientName,
    status: row.status,
    extractionSchemaId: row.extractionSchemaId,
    extractionSchemaVersion: row.extractionSchema?.version ?? null,
    extractionSchemaTitle: row.extractionSchema?.title ?? null,
    errorMessage: row.errorMessage,
    extractedPayload: toExtractedFieldViews(row.extractedPayload),
    // ISO strings, not Date — this shape is JSON.stringify'd straight into
    // Redis and must survive the round-trip unchanged.
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // The DB join carries only version/title (for the dashboard label); the
    // full schema payload is populated from the cache, never here.
    extractionSchema: null,
  };
}
