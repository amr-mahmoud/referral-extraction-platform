import { Inject, Injectable } from '@nestjs/common';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { FieldDefinition } from '../../domain/extraction-schema/field-definition.value-object';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { NotImplementedError } from '../errors/not-implemented.error';
import {
  EXTRACTION_SCHEMA_REPOSITORY_PORT,
  type ExtractionSchemaRepositoryPort,
} from '../ports/extraction-schema-repository.port';

export interface CreateExtractionSchemaCommand {
  clinicId: ClinicId;
  schemaDefinition: FieldDefinition[];
}

@Injectable()
export class ExtractionSchemaService {
  public constructor(
    @Inject(EXTRACTION_SCHEMA_REPOSITORY_PORT)
    private readonly schemaRepository: ExtractionSchemaRepositoryPort,
  ) {}

  public create(
    command: CreateExtractionSchemaCommand,
  ): Promise<ExtractionSchema> {
    void command;
    throw new NotImplementedError('ExtractionSchemaService.create');
  }

  public listByClinic(clinicId: ClinicId): Promise<ExtractionSchema[]> {
    void clinicId;
    throw new NotImplementedError('ExtractionSchemaService.listByClinic');
  }
}
