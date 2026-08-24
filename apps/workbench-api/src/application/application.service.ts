import { Inject, Injectable } from '@nestjs/common';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicNotFoundError,
  ClinicUsernameTakenError,
} from '../domain/clinic/clinic.errors';
import { PasswordHash } from '../domain/clinic/password-hash.value-object';
import { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import { FieldDefinition } from '../domain/extraction-schema/field-definition.value-object';
import { ExtractedField } from '../domain/referral/extracted-field.value-object';
import { Referral } from '../domain/referral/referral.aggregate';
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
import { STORAGE_PORT, type StoragePort } from './ports/storage.port';
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
  schemaDefinition: FieldDefinition[];
}

// ── Referral Commands & Queries ──────────────────────────────────────

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

      const clinic = Clinic.register({
        id: ClinicId.from(crypto.randomUUID()),
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
      void command;
      throw new NotImplementedError(
        'ApplicationService.createExtractionSchema',
      );
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
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
      void clinicId;
      throw new NotImplementedError('ApplicationService.listExtractionSchemas');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to list extraction schemas: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ── Referrals ────────────────────────────────────────────────────

  public async createReferral(
    command: CreateReferralCommand,
  ): Promise<Referral> {
    try {
      void command;
      throw new NotImplementedError('ApplicationService.createReferral');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to create referral: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
