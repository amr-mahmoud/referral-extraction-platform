import { PrismaClient, Prisma, ReferralStatus } from '@prisma/client';
import type { ExtractedFieldPayload } from '../../types/extraction.types';
import type { CachedExtractionSchema } from '../../types/referral-job.types';

export interface ReferralMetadataForFallback {
  fileName: string;
  extractionSchema: CachedExtractionSchema | null;
}

export class PrismaService {
  private readonly client: PrismaClient;

  public constructor(databaseUrl: string) {
    this.client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  }

  public async claimReferral(referralId: string): Promise<boolean> {
    const result = await this.client.referral.updateMany({
      where: {
        id: referralId,
        status: { in: [ReferralStatus.AWAITING_UPLOAD, ReferralStatus.PENDING] },
      },
      data: { status: ReferralStatus.PROCESSING },
    });
    return result.count > 0;
  }

  public async markAsCompleted(
    referralId: string,
    extractedPayload: ExtractedFieldPayload[],
    patientName: string | null,
  ): Promise<void> {
    await this.client.referral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.COMPLETED,
        extractedPayload: extractedPayload as unknown as Prisma.InputJsonValue,
        patientName,
      },
    });
  }

  public async markAsRejected(referralId: string, reason: string): Promise<void> {
    await this.client.referral.update({
      where: { id: referralId },
      data: { status: ReferralStatus.REJECTED, errorMessage: reason },
    });
  }

  public async markAsFailed(referralId: string, errorMessage: string): Promise<void> {
    await this.client.referral.update({
      where: { id: referralId },
      data: { status: ReferralStatus.FAILED, errorMessage },
    });
  }

  public async getReferralMetadataForFallback(
    referralId: string,
  ): Promise<ReferralMetadataForFallback | null> {
    const referral = await this.client.referral.findUnique({
      where: { id: referralId },
      select: { fileName: true, extractionSchemaId: true },
    });
    if (!referral) {
      return null;
    }

    let extractionSchema: CachedExtractionSchema | null = null;
    if (referral.extractionSchemaId) {
      const schema = await this.client.extractionSchema.findUnique({
        where: { id: referral.extractionSchemaId },
        select: { id: true, version: true, schemaDefinition: true },
      });
      if (schema) {
        extractionSchema = {
          id: schema.id,
          version: schema.version,
          schemaDefinition: schema.schemaDefinition as CachedExtractionSchema['schemaDefinition'],
        };
      }
    }

    return { fileName: referral.fileName, extractionSchema };
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
