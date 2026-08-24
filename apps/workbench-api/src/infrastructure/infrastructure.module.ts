import { Module } from '@nestjs/common';
import { CLINIC_REPOSITORY_PORT } from '../application/ports/clinic-repository.port';
import { EXTRACTION_SCHEMA_REPOSITORY_PORT } from '../application/ports/extraction-schema-repository.port';
import { PASSWORD_HASHER_PORT } from '../application/ports/password-hasher.port';
import { REFERRAL_REPOSITORY_PORT } from '../application/ports/referral-repository.port';
import { STORAGE_PORT } from '../application/ports/storage.port';
import { TOKEN_PORT } from '../application/ports/token.port';
import { BcryptPasswordHasherService } from './auth/bcrypt-password-hasher.service';
import { JwtTokenService } from './auth/jwt-token.service';
import { PostgresListenService } from './notifications/postgres-listen.service';
import { PrismaClinicRepository } from './repository/clinic.repository';
import { PrismaExtractionSchemaRepository } from './repository/extraction-schema.repository';
import { PrismaReferralRepository } from './repository/referral.repository';
import { PrismaService } from './repository/prisma.service';
import { S3StorageService } from './storage/s3-storage.service';

@Module({
  providers: [
    PrismaService,
    {
      provide: CLINIC_REPOSITORY_PORT,
      useClass: PrismaClinicRepository,
    },
    {
      provide: REFERRAL_REPOSITORY_PORT,
      useClass: PrismaReferralRepository,
    },
    {
      provide: EXTRACTION_SCHEMA_REPOSITORY_PORT,
      useClass: PrismaExtractionSchemaRepository,
    },
    {
      provide: STORAGE_PORT,
      useClass: S3StorageService,
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherService,
    },
    {
      provide: TOKEN_PORT,
      useClass: JwtTokenService,
    },
    PostgresListenService,
  ],
  exports: [
    PrismaService,
    CLINIC_REPOSITORY_PORT,
    REFERRAL_REPOSITORY_PORT,
    EXTRACTION_SCHEMA_REPOSITORY_PORT,
    STORAGE_PORT,
    PASSWORD_HASHER_PORT,
    TOKEN_PORT,
  ],
})
export class InfrastructureModule {}
