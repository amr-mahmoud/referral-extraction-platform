import type { GeminiClient } from '../clients/ai/gemini-client.service';
import type { S3StorageService } from '../clients/aws/s3.service';
import type { SqsStatusUpdatePublisher } from '../clients/aws/sqs-status-update-publisher.service';
import type { RedisService } from '../clients/cache/redis.service';
import type {
  CachedExtractionSchema,
  ReferralJobContext,
  ReferralJobResult,
  ReferralStatusUpdateEvent,
} from '../types/referral-job.types';
import { buildFieldInstructions, buildGeminiExtractionSchema } from './extraction-schema';
import { logExtractionResult } from './extraction-logger';
import { normalizeExtractionOutput } from './payload-normalizer';
import { preValidatePdfBuffer } from './pre-validator.service';

export class ReferralExtractionService {
  public constructor(
    private readonly redis: RedisService,
    private readonly s3: S3StorageService,
    private readonly gemini: GeminiClient,
    private readonly statusUpdatePublisher: SqsStatusUpdatePublisher,
    private readonly claimTtlSeconds: number,
    private readonly workerId: string,
  ) {}

  public async processMessage(context: ReferralJobContext): Promise<ReferralJobResult> {
    let isClaimed = false;
    try {
      isClaimed = await this.redis.tryClaimReferral(
        context.referralId,
        this.claimTtlSeconds,
        this.workerId,
      );
      if (!isClaimed) {
        return {
          kind: 'SKIPPED',
          reason: 'Referral is already claimed by another worker',
        };
      }

      // Surface PROCESSING so the dashboard shows the job is in flight; the
      // workbench applies it via the aggregate's startProcessing(). Exactly one
      // terminal event (COMPLETED/REJECTED/FAILED) follows.
      await this.publishStatusUpdate({
        referralId: context.referralId,
        clinicId: context.clinicId,
        status: 'PROCESSING',
        extractedPayload: [],
        patientName: null,
        extractionSchemaId: null,
        errorMessage: null,
        extractedAt: new Date().toISOString(),
      });

      const metadata = await this.resolveReferralMetadata(context.referralId);
      const pdfBuffer = await this.s3.downloadPdf(context.bucket, context.key);

      const validation = preValidatePdfBuffer(pdfBuffer);
      if (!validation.isValid) {
        const reason = validation.reason ?? 'Pre-validation failed';
        await this.publishStatusUpdate({
          referralId: context.referralId,
          clinicId: context.clinicId,
          status: 'REJECTED',
          extractedPayload: [],
          patientName: null,
          extractionSchemaId: null,
          errorMessage: reason,
          extractedAt: new Date().toISOString(),
        });
        await this.redis.releaseReferralClaim(context.referralId);
        return { kind: 'REJECTED', reason };
      }

      const schemaDefinition = metadata?.schemaDefinition ?? null;
      const resolvedSchemaId = metadata?.id ?? null;
      const responseSchema = buildGeminiExtractionSchema(schemaDefinition);
      const fieldInstructions = buildFieldInstructions(schemaDefinition);

      const rawOutput = await this.gemini.extractReferralData(
        pdfBuffer,
        responseSchema,
        fieldInstructions,
      );
      const normalized = normalizeExtractionOutput(rawOutput, schemaDefinition);
      logExtractionResult(context, rawOutput, normalized);

      if (!normalized.isValidDocument) {
        const reason =
          normalized.rejectionReason ?? 'Document rejected by the extraction model';
        await this.publishStatusUpdate({
          referralId: context.referralId,
          clinicId: context.clinicId,
          status: 'REJECTED',
          extractedPayload: [],
          patientName: null,
          extractionSchemaId: null,
          errorMessage: reason,
          extractedAt: new Date().toISOString(),
        });
        await this.redis.releaseReferralClaim(context.referralId);
        return { kind: 'REJECTED', reason };
      }

      await this.publishStatusUpdate({
        referralId: context.referralId,
        clinicId: context.clinicId,
        status: 'COMPLETED',
        extractedPayload: normalized.extractedFields,
        patientName: normalized.patientName,
        extractionSchemaId: resolvedSchemaId,
        errorMessage: null,
        extractedAt: new Date().toISOString(),
      });
      await this.redis.releaseReferralClaim(context.referralId);

      return { kind: 'COMPLETED' };
    } catch (error) {
      // Best-effort FAILED so the dashboard reflects the state, then release
      // the claim and rethrow so the SQS upload message redelivers for retry.
      if (isClaimed) {
        await this.publishFailureBestEffort(context, error);
        await this.redis.releaseReferralClaim(context.referralId);
      }
      throw error;
    }
  }

  /**
   * Resolves the extraction schema from the workbench's cached referral
   * projection (`referral:{id}`) — written at creation time, so a cold cache
   * is the only miss path and degrades to the default LLM schema.
   */
  private async resolveReferralMetadata(
    referralId: string,
  ): Promise<CachedExtractionSchema | null> {
    try {
      const cachedMetadata = await this.redis.getReferralMetadata(referralId);
      if (cachedMetadata) {
        if (cachedMetadata.extractionSchema) {
          return cachedMetadata.extractionSchema;
        }
        // A resolved schema id with no cached payload would silently fall back
        // to the default LLM schema — never do that silently.
        if (cachedMetadata.extractionSchemaId) {
          console.warn(
            `[Worker] Referral ${referralId} has extractionSchemaId ${cachedMetadata.extractionSchemaId} but no cached schema payload; using the default LLM schema`,
          );
        }
        return null;
      }
    } catch (error) {
      console.error(
        `[Worker] Redis metadata read failed for referral ${referralId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return null;
  }

  private async publishStatusUpdate(
    event: ReferralStatusUpdateEvent,
  ): Promise<void> {
    await this.statusUpdatePublisher.publish(event);
    console.log(
      `[Worker] Published status update -> referral ${event.referralId}: ${event.status}`,
    );
  }

  private async publishFailureBestEffort(
    context: ReferralJobContext,
    error: unknown,
  ): Promise<void> {
    try {
      await this.statusUpdatePublisher.publish({
        referralId: context.referralId,
        clinicId: context.clinicId,
        status: 'FAILED',
        extractedPayload: [],
        patientName: null,
        extractionSchemaId: null,
        errorMessage: error instanceof Error ? error.message : String(error),
        extractedAt: new Date().toISOString(),
      });
    } catch (publishError) {
      console.error(
        `[Worker] Failed to publish FAILED status for referral ${context.referralId}: ${
          publishError instanceof Error ? publishError.message : String(publishError)
        }`,
      );
    }
  }
}
