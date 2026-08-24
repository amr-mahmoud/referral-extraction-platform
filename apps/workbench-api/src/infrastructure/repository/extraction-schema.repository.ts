import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import { ExtractionSchemaRepositoryPort } from '../../application/ports/extraction-schema-repository.port';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaExtractionSchemaRepository implements ExtractionSchemaRepositoryPort {
  public constructor(private readonly prismaService: PrismaService) {}

  public findById(id: ExtractionSchemaId): Promise<ExtractionSchema | null> {
    void id;
    throw new NotImplementedError('PrismaExtractionSchemaRepository.findById');
  }

  public listByClinicId(clinicId: ClinicId): Promise<ExtractionSchema[]> {
    void clinicId;
    throw new NotImplementedError(
      'PrismaExtractionSchemaRepository.listByClinicId',
    );
  }

  public findLatestByClinicId(
    clinicId: ClinicId,
  ): Promise<ExtractionSchema | null> {
    void clinicId;
    throw new NotImplementedError(
      'PrismaExtractionSchemaRepository.findLatestByClinicId',
    );
  }

  public save(schema: ExtractionSchema): Promise<ExtractionSchema> {
    void schema;
    throw new NotImplementedError('PrismaExtractionSchemaRepository.save');
  }
}
