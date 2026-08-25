import { Inject, Injectable } from '@nestjs/common';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicNotFoundError,
  ClinicUsernameTakenError,
} from '../domain/clinic/clinic.errors';
import type { FieldDefinitionInput } from '../domain/domain-types/extraction-schema.input';
import { ExtractionSchemaNotFoundError } from '../domain/extraction-schema/extraction-schema.errors';
import { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import { ExtractedField } from '../domain/referral/extracted-field.value-object';
import { Referral } from '../domain/referral/referral.aggregate';
import { ReferralValidationError } from '../domain/referral/referral.errors';
import { ClinicId } from '../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../domain/shared/ids/extraction-schema-id.value-object';
import { ReferralId } from '../domain/shared/ids/referral-id.value-object';
import { DomainError } from '../domain/shared/domain.error';
import { NotImplementedError } from './errors/not-implemented.error';
import {
  CLINIC_REPOSITORY_PORT,
  type ClinicRepositoryPort,
} from './ports/clinic-repository.port';
import { ENCRYPTION_PORT, type EncryptionPort } from './ports/encryption.port';
import {
  Paginated,
  REFERRAL_REPOSITORY_PORT,
  type ReferralRepositoryPort,
} from './ports/referral-repository.port';
import {
  PresignedUrl,
  STORAGE_PORT,
  type StoragePort,
} from './ports/storage.port';
import { TOKEN_PORT, type TokenPort } from './ports/token.port';

// ── Auth Commands & Results ──────────────────────────────────────────

export interface SignupCommand {
  clinicName: string;
  username: string;
  password: string;
}

export interface LoginCommand {
  username: string;
  password: string;
}

export interface AuthResult {
  clinic: Clinic;
  token: string;
}

// ── Extraction Schema Commands ───────────────────────────────────────

export interface CreateExtractionSchemaCommand {
  clinicId: ClinicId;
  /** Already normalised by the interface layer; see `normalizeExtractionSchemaFields`. */
  fields: FieldDefinitionInput[];
}

// ── Referral Commands & Queries ──────────────────────────────────────

export interface CreateReferralItemCommand {
  fileName: string;
  patientName?: string | null;
}

export interface CreateNewReferralsWithAttachedPresignedUrlsCommand {
  clinicId: ClinicId;
  files: CreateReferralItemCommand[];
  /** Shared across the whole batch. Falls back to the clinic's default, then `null`. */
  extractionSchemaId?: ExtractionSchemaId | null;
}

export interface ReferralWithPresignedUpload {
  referral: Referral;
  upload: PresignedUrl;
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

// ── Unified Application Service ──────────────────────────────────────

@Injectable()
export class ApplicationService {
  public constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepository: ClinicRepositoryPort,
    @Inject(REFERRAL_REPOSITORY_PORT)
    private readonly referralRepository: ReferralRepositoryPort,
    @Inject(ENCRYPTION_PORT)
    private readonly encryptionService: EncryptionPort,
    @Inject(TOKEN_PORT)
    private readonly tokenService: TokenPort,
    @Inject(STORAGE_PORT)
    private readonly storageService: StoragePort,
  ) {}

  // ── Auth ─────────────────────────────────────────────────────────

  public async signup(command: SignupCommand): Promise<AuthResult> {
    try {
      const existingClinic = await this.clinicRepository.findByUsername(
        command.username,
      );
      if (existingClinic) {
        throw new ClinicUsernameTakenError(command.username);
      }

      const hashedPassword = await this.encryptionService.hash(
        command.password,
      );

      const clinic = new Clinic({
        clinicName: command.clinicName,
        username: command.username,
        rawPassword: command.password,
        hashedPassword,
      });

      const savedClinic = await this.clinicRepository.save(clinic);

      const token = this.tokenService.sign({
        clinicId: savedClinic.id.value,
        username: savedClinic.username,
      });

      return { clinic: savedClinic, token };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to sign up clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async login(command: LoginCommand): Promise<AuthResult> {
    try {
      const clinic = await this.clinicRepository.findByUsername(
        command.username,
      );
      if (!clinic) {
        throw new ClinicInvalidCredentialsError();
      }

      await clinic.verifyPassword(
        command.password,
        this.encryptionService.verify.bind(this.encryptionService),
      );

      const token = this.tokenService.sign({
        clinicId: clinic.id.value,
        username: clinic.username,
      });

      return { clinic, token };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to log in clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async getClinic(clinicId: ClinicId): Promise<Clinic> {
    try {
      const clinic = await this.clinicRepository.findById(clinicId);
      if (!clinic) {
        throw new ClinicNotFoundError(clinicId.value);
      }
      return clinic;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to get clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ── Extraction Schemas ───────────────────────────────────────────

  public async createExtractionSchema(
    command: CreateExtractionSchemaCommand,
  ): Promise<ExtractionSchema> {
    try {
      // 1. Find the version this schema supersedes (0 when the clinic has none).
      const latestVersion = await this.clinicRepository.findLatestSchemaVersion(
        command.clinicId,
      );

      // 2. Build the aggregate — it validates every field (parameter name +
      //    mandatory description) and derives the next version itself.
      const schemaAggregate = new ExtractionSchema({
        clinicId: command.clinicId,
        schemaDefinition: command.fields,
        ...(latestVersion > 0 ? { oldVersion: latestVersion } : { version: 1 }),
      });

      // 3. Persist domain aggregate via ClinicRepositoryPort
      return await this.clinicRepository.saveExtractionSchema(schemaAggregate);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to create extraction schema: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async listExtractionSchemas(
    clinicId: ClinicId,
  ): Promise<ExtractionSchema[]> {
    try {
      return await this.clinicRepository.listExtractionSchemasByClinic(
        clinicId,
      );
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to list extraction schemas: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ── Referrals ────────────────────────────────────────────────────

  public async createNewReferralsWithAttachedPresignedUrls(
    command: CreateNewReferralsWithAttachedPresignedUrlsCommand,
  ): Promise<ReferralWithPresignedUpload[]> {
    try {
      if (command.files.length === 0) {
        // Reuses the existing ReferralValidationError — defense-in-depth behind
        // the DTO's @ArrayNotEmpty, no new error class.
        throw new ReferralValidationError(
          'At least one referral file is required',
        );
      }

      // 1. Resolve schema ONCE — clinic-scoped, not file-scoped.
      const extractionSchemaId = await this.resolveExtractionSchemaId(
        command.clinicId,
        command.extractionSchemaId,
      );

      // 2. Construct ALL aggregates up front — one bad fileName fails the
      //    whole batch before anything is persisted or presigned (fail-fast).
      const referrals = command.files.map(
        (file) =>
          new Referral({
            clinicId: command.clinicId,
            fileName: file.fileName,
            patientName: file.patientName ?? null,
            extractionSchemaId,
          }),
      );

      // 3. Presign all uploads. getSignedUrl is a local SigV4 signing
      //    operation (no AWS network round-trip), so doing this before the DB
      //    write is cheap and means a presigning failure leaves zero rows
      //    committed.
      const uploads = await Promise.all(
        referrals.map((referral) =>
          this.storageService.presignReferralUpload(
            command.clinicId,
            referral.id,
          ),
        ),
      );

      // 4. Persist all rows atomically — all-or-nothing.
      const savedReferrals =
        await this.referralRepository.saveReferrals(referrals);

      // 5. Zip by index — referrals/uploads/savedReferrals are all the same
      //    length and order as `command.files`.
      return savedReferrals.map((referral, index) => ({
        referral,
        upload: uploads[index],
      }));
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to create referrals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async resolveExtractionSchemaId(
    clinicId: ClinicId,
    requestedExtractionSchemaId: ExtractionSchemaId | null | undefined,
  ): Promise<ExtractionSchemaId | null> {
    if (requestedExtractionSchemaId) {
      const schema = await this.clinicRepository.findExtractionSchemaById(
        requestedExtractionSchemaId,
      );
      // Treat "belongs to another clinic" the same as "not found" — a valid
      // but foreign id must not leak whether it exists.
      if (!schema || !schema.clinicId.equals(clinicId)) {
        throw new ExtractionSchemaNotFoundError(
          requestedExtractionSchemaId.value,
        );
      }
      return requestedExtractionSchemaId;
    }

    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(clinicId.value);
    }
    return clinic.defaultExtractionSchemaId;
  }

  public async listReferralsByClinic(
    query: ListReferralsQuery,
  ): Promise<Paginated<Referral>> {
    try {
      void query;
      throw new NotImplementedError('ApplicationService.listReferralsByClinic');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to list referrals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async getReferralByClinic(
    clinicId: ClinicId,
    referralId: ReferralId,
  ): Promise<Referral> {
    try {
      void clinicId;
      void referralId;
      throw new NotImplementedError('ApplicationService.getReferralByClinic');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to get referral: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async correctReferral(
    command: CorrectReferralCommand,
  ): Promise<Referral> {
    try {
      void command;
      throw new NotImplementedError('ApplicationService.correctReferral');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to correct referral: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
