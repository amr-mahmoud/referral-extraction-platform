import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';

export const CLINIC_REPOSITORY_PORT = 'CLINIC_REPOSITORY_PORT';

export interface ClinicRepositoryPort {
  findById(id: ClinicId): Promise<Clinic | null>;
  findByUsername(username: string): Promise<Clinic | null>;
  save(clinic: Clinic): Promise<Clinic>;
  saveExtractionSchema(schema: ExtractionSchema): Promise<ExtractionSchema>;
  findLatestSchemaVersion(clinicId: ClinicId): Promise<number>;
  findExtractionSchemaById(
    id: ExtractionSchemaId,
  ): Promise<ExtractionSchema | null>;
  listExtractionSchemasByClinic(
    clinicId: ClinicId,
  ): Promise<ExtractionSchema[]>;
}
