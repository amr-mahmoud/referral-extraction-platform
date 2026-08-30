import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';

export const CLINIC_REPOSITORY_PORT = 'CLINIC_REPOSITORY_PORT';

export interface ClinicRepositoryPort {
  findById(id: string): Promise<Clinic | null>;
  findByUsername(username: string): Promise<Clinic | null>;
  save(clinic: Clinic): Promise<Clinic>;
  saveExtractionSchema(schema: ExtractionSchema): Promise<ExtractionSchema>;
  findLatestSchemaVersion(clinicId: string): Promise<number>;
  listExtractionSchemasByClinic(clinicId: string): Promise<ExtractionSchema[]>;
}
