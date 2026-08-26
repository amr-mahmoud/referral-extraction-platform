import { ExtractionSchema as PrismaExtractionSchema } from '@prisma/client';
import type { FieldDefinitionInput } from '../../domain/domain-types/extraction-schema.input';
import { ExtractionSchema } from '../../domain/extraction-schema/extraction-schema.aggregate';

export class ExtractionSchemaMapper {
  public static toDomain(raw: PrismaExtractionSchema): ExtractionSchema {
    // The aggregate builds and re-validates the FieldDefinition VOs itself, so
    // the stored JSON is handed over as raw input rather than pre-constructed.
    const schemaDefinition = Array.isArray(raw.schemaDefinition)
      ? (raw.schemaDefinition as unknown as FieldDefinitionInput[])
      : [];

    return new ExtractionSchema({
      id: raw.id,
      clinicId: raw.clinicId,
      version: raw.version,
      // Nullable for pre-title rows; the aggregate resolves the v{n} fallback.
      title: raw.title ?? undefined,
      schemaDefinition,
      createdAt: raw.createdAt,
    });
  }

  public static toPersistence(schema: ExtractionSchema) {
    return {
      id: schema.id,
      clinicId: schema.clinicId,
      version: schema.version,
      title: schema.title,
      schemaDefinition: schema.schemaDefinition.map((field) => ({
        key: field.key,
        label: field.label,
        description: field.description,
      })),
      createdAt: schema.createdAt,
    };
  }
}
