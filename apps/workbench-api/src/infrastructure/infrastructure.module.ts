import { Module } from '@nestjs/common';
import { CACHING_SERVICE_PORT } from '../application/ports/caching.port';
import { CLINIC_REPOSITORY_PORT } from '../application/ports/clinic-repository.port';
import { ENCRYPTION_PORT } from '../application/ports/encryption.port';
import { REFERRAL_REPOSITORY_PORT } from '../application/ports/referral-repository.port';
import { STORAGE_PORT } from '../application/ports/storage.port';
import { TOKEN_PORT } from '../application/ports/token.port';
import { BcryptEncryptionService } from './auth/bcrypt-password-hasher.service';
import { JwtTokenService } from './auth/jwt-token.service';
import { RedisService } from './caching/redis.service';
import { PostgresListenService } from './notifications/postgres-listen.service';
import { PrismaClinicRepository } from './repository/clinic.repository';
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
      provide: STORAGE_PORT,
      useClass: S3StorageService,
    },
    {
      provide: ENCRYPTION_PORT,
      useClass: BcryptEncryptionService,
    },
    {
      provide: TOKEN_PORT,
      useClass: JwtTokenService,
    },
    {
      provide: CACHING_SERVICE_PORT,
      useClass: RedisService,
    },
    PostgresListenService,
  ],
  exports: [
    PrismaService,
    CLINIC_REPOSITORY_PORT,
    REFERRAL_REPOSITORY_PORT,
    STORAGE_PORT,
    ENCRYPTION_PORT,
    TOKEN_PORT,
    CACHING_SERVICE_PORT,
    PostgresListenService,
  ],
})
export class InfrastructureModule {}
