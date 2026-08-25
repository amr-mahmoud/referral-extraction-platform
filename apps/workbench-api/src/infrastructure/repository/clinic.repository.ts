import { Injectable } from '@nestjs/common';
import { ClinicRepositoryPort } from '../../application/ports/clinic-repository.port';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';
import { ClinicMapper } from './clinic.mapper';
import { ExtractionSchemaMapper } from './extraction-schema.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClinicRepository implements ClinicRepositoryPort {
  public constructor(private readonly prisma: PrismaService) {}

  public async findById(id: ClinicId): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({
      where: { id: id.value },
    });

    if (!row) {
      return null;
    }

    return ClinicMapper.toDomain(row);
  }

  public async findByUsername(username: string): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({
      where: { username },
    });

    if (!row) {
      return null;
    }

    return ClinicMapper.toDomain(row);
  }

  public async save(clinic: Clinic): Promise<Clinic> {
    const data = ClinicMapper.toPersistence(clinic);

    const row = await this.prisma.clinic.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    return ClinicMapper.toDomain(row);
  }

  public async saveExtractionSchema(
    schema: ExtractionSchema,
  ): Promise<ExtractionSchema> {
    const data = ExtractionSchemaMapper.toPersistence(schema);

    const row = await this.prisma.extractionSchema.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    return ExtractionSchemaMapper.toDomain(row);
  }

  public async findLatestSchemaVersion(clinicId: ClinicId): Promise<number> {
    const latest = await this.prisma.extractionSchema.findFirst({
      where: { clinicId: clinicId.value },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return latest?.version ?? 0;
  }

  public async findExtractionSchemaById(
    id: ExtractionSchemaId,
  ): Promise<ExtractionSchema | null> {
    const row = await this.prisma.extractionSchema.findUnique({
      where: { id: id.value },
    });

    if (!row) {
      return null;
    }

    return ExtractionSchemaMapper.toDomain(row);
  }

  public async listExtractionSchemasByClinic(
    clinicId: ClinicId,
  ): Promise<ExtractionSchema[]> {
    const rows = await this.prisma.extractionSchema.findMany({
      where: { clinicId: clinicId.value },
      orderBy: { version: 'asc' },
    });

    return rows.map((row) => ExtractionSchemaMapper.toDomain(row));
  }
}
