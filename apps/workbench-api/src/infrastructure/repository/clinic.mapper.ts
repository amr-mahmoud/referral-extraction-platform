import { Clinic as PrismaClinic } from '@prisma/client';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { PasswordHash } from '../../domain/clinic/password-hash.value-object';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../../domain/shared/ids/extraction-schema-id.value-object';

export class ClinicMapper {
  public static toDomain(raw: PrismaClinic): Clinic {
    return new Clinic({
      id: ClinicId.from(raw.id),
      clinicName: raw.clinicName,
      username: raw.username,
      passwordHash: PasswordHash.from(raw.passwordHash),
      defaultExtractionSchemaId: raw.defaultExtractionSchemaId
        ? ExtractionSchemaId.from(raw.defaultExtractionSchemaId)
        : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(clinic: Clinic) {
    return {
      id: clinic.id.value,
      clinicName: clinic.clinicName,
      username: clinic.username,
      passwordHash: clinic.passwordHash.value,
      defaultExtractionSchemaId:
        clinic.defaultExtractionSchemaId?.value ?? null,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }
}
