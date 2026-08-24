import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';

export const EXTRACTION_SCHEMA_REPOSITORY_PORT =
  'EXTRACTION_SCHEMA_REPOSITORY_PORT';

export interface ExtractionSchemaRepositoryPort {
  findById(id: ExtractionSchemaId): Promise<ExtractionSchema | null>;
  listByClinicId(clinicId: ClinicId): Promise<ExtractionSchema[]>;
  findLatestByClinicId(clinicId: ClinicId): Promise<ExtractionSchema | null>;
  save(schema: ExtractionSchema): Promise<ExtractionSchema>;
}
