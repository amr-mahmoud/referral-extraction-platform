import { Clinic as PrismaClinic } from '@prisma/client';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { PasswordHash } from '../../domain/clinic/password-hash.value-object';

export class ClinicMapper {
  public static toDomain(raw: PrismaClinic): Clinic {
    return new Clinic({
      id: raw.id,
      clinicName: raw.clinicName,
      username: raw.username,
      passwordHash: PasswordHash.from(raw.passwordHash),
      defaultExtractionSchemaId: raw.defaultExtractionSchemaId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(clinic: Clinic) {
    return {
      id: clinic.id,
      clinicName: clinic.clinicName,
      username: clinic.username,
      passwordHash: clinic.passwordHash.value,
      defaultExtractionSchemaId: clinic.defaultExtractionSchemaId,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }
}
