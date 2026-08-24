import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';

export const CLINIC_REPOSITORY_PORT = 'CLINIC_REPOSITORY_PORT';

export interface ClinicRepositoryPort {
  findById(id: ClinicId): Promise<Clinic | null>;
  findByUsername(username: string): Promise<Clinic | null>;
  save(clinic: Clinic): Promise<Clinic>;
}
