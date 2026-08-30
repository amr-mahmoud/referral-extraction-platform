import { Injectable } from '@nestjs/common';
import { REPOSITORY_ERROR } from '../../../libs/errors/repository-error-code.enum';
import { ClinicRepositoryPort } from '../../application/ports/clinic-repository.port';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { RepositoryException } from '../errors/repository.exception';
import { ClinicMapper } from './clinic.mapper';
import { ExtractionSchemaMapper } from './extraction-schema.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClinicRepository implements ClinicRepositoryPort {
  public constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Clinic | null> {
    try {
      const row = await this.prisma.clinic.findUnique({
        where: { id },
      });

      if (!row) {
        return null;
      }

      return ClinicMapper.toDomain(row);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findById',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async findByUsername(username: string): Promise<Clinic | null> {
    try {
      const row = await this.prisma.clinic.findUnique({
        where: { username },
      });

      if (!row) {
        return null;
      }

      return ClinicMapper.toDomain(row);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findByUsername',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async save(clinic: Clinic): Promise<Clinic> {
    try {
      const data = ClinicMapper.toPersistence(clinic);

      const row = await this.prisma.clinic.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      return ClinicMapper.toDomain(row);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'save',
        REPOSITORY_ERROR.DATABASE_WRITE_FAILED,
      );
    }
  }

  public async saveExtractionSchema(
    schema: ExtractionSchema,
  ): Promise<ExtractionSchema> {
    try {
      const data = ExtractionSchemaMapper.toPersistence(schema);

      const row = await this.prisma.extractionSchema.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      return ExtractionSchemaMapper.toDomain(row);
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'saveExtractionSchema',
        REPOSITORY_ERROR.DATABASE_WRITE_FAILED,
      );
    }
  }

  public async findLatestSchemaVersion(clinicId: string): Promise<number> {
    try {
      const latest = await this.prisma.extractionSchema.findFirst({
        where: { clinicId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      return latest?.version ?? 0;
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'findLatestSchemaVersion',
        REPOSITORY_ERROR.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async listExtractionSchemasByClinic(
    clinicId: string,
  ): Promise<ExtractionSchema[]> {
    try {
      const rows = await this.prisma.extractionSchema.findMany({
        where: { clinicId },
        orderBy: { version: 'asc' },
      });

      return rows.map((row) => ExtractionSchemaMapper.toDomain(row));
    } catch (error) {
      throw this.toRepositoryException(
        error,
        'listExtractionSchemasByClinic',
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
      PrismaClinicRepository.name,
      methodSrc,
    );
  }
}
