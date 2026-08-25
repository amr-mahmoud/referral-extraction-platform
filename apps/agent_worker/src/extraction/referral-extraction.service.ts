import type { GeminiClient } from '../clients/ai/gemini-client.service';
import type { S3StorageService } from '../clients/aws/s3.service';
import type { RedisService } from '../clients/cache/redis.service';
import type { PrismaService } from '../clients/database/prisma.service';
import type {
  CachedExtractionSchema,
  ReferralJobContext,
  ReferralJobResult,
} from '../types/referral-job.types';
import { buildFieldInstructions, buildGeminiExtractionSchema } from './extraction-schema';
import { logExtractionResult } from './extraction-logger';
import { normalizeExtractionOutput } from './payload-normalizer';
import { preValidatePdfBuffer } from './pre-validator.service';

export class ReferralExtractionService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly s3: S3StorageService,
    private readonly gemini: GeminiClient,
  ) {}

  public async processMessage(context: ReferralJobContext): Promise<ReferralJobResult> {
    try {
      const isClaimed = await this.prisma.claimReferral(context.referralId);
      if (!isClaimed) {
        return {
          kind: 'SKIPPED',
          reason: 'Referral is already claimed or in a terminal state',
        };
      }

      const metadata = await this.resolveReferralMetadata(context.referralId);
      const pdfBuffer = await this.s3.downloadPdf(context.bucket, context.key);

      const validation = preValidatePdfBuffer(pdfBuffer);
      if (!validation.isValid) {
        const reason = validation.reason ?? 'Pre-validation failed';
        await this.prisma.markAsRejected(context.referralId, reason);
        return { kind: 'REJECTED', reason };
      }

      const schemaDefinition = metadata?.schemaDefinition ?? null;
      const responseSchema = buildGeminiExtractionSchema(schemaDefinition);
      const fieldInstructions = buildFieldInstructions(schemaDefinition);

      const rawOutput = await this.gemini.extractReferralData(
        pdfBuffer,
        responseSchema,
        fieldInstructions,
      );
      const normalized = normalizeExtractionOutput(rawOutput);
      logExtractionResult(context, rawOutput, normalized);

      if (!normalized.isValidDocument) {
        const reason =
          normalized.rejectionReason ?? 'Document rejected by the extraction model';
        await this.prisma.markAsRejected(context.referralId, reason);
        return { kind: 'REJECTED', reason };
      }

      await this.prisma.markAsCompleted(
        context.referralId,
        normalized.extractedFields,
        normalized.patientName,
      );
      await this.indexReferralForClinicBestEffort(context.clinicId, context.referralId);

      return { kind: 'COMPLETED' };
    } catch (error) {
      await this.markAsFailedBestEffort(context.referralId, error);
      throw error;
    }
  }

  private async resolveReferralMetadata(
    referralId: string,
  ): Promise<CachedExtractionSchema | null> {
    const cachedMetadata = await this.redis.getReferralMetadata(referralId);
    if (cachedMetadata) {
      return cachedMetadata.extractionSchema;
    }

    const fallbackMetadata =
      await this.prisma.getReferralMetadataForFallback(referralId);
    return fallbackMetadata?.extractionSchema ?? null;
  }

  private async indexReferralForClinicBestEffort(
    clinicId: string,
    referralId: string,
  ): Promise<void> {
    try {
      await this.redis.indexReferralForClinic(clinicId, referralId);
    } catch (error) {
      console.error(
        `[Worker] Failed to index referral ${referralId} for clinic ${clinicId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async markAsFailedBestEffort(
    referralId: string,
    error: unknown,
  ): Promise<void> {
    try {
      await this.prisma.markAsFailed(
        referralId,
        error instanceof Error ? error.message : String(error),
      );
    } catch (markAsFailedError) {
      console.error(
        `[Worker] Failed to mark referral ${referralId} as FAILED: ${
          markAsFailedError instanceof Error
            ? markAsFailedError.message
            : String(markAsFailedError)
        }`,
      );
    }
  }
}
