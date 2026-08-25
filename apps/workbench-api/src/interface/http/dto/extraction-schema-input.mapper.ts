import { BadRequestException } from '@nestjs/common';
import type { FieldDefinitionInput } from '../../../domain/domain-types/extraction-schema.input';

/**
 * Anti-corruption boundary for extraction-schema field input.
 *
 * Clients may express a schema two ways (see `docs/product_solution_design.md`
 * §2 — "supplying Field Name and Description ... or by uploading a JSON
 * configuration file"):
 *
 *   1. An array of field objects, as the in-app field builder emits.
 *   2. A flat `name -> description` map, as a hand-authored JSON config file.
 *
 * Both normalise to the single shape the domain understands. Only *structural*
 * problems are rejected here (a 400 concern); the semantic rules — every field
 * needs a name and a non-empty description — stay in `ExtractionSchema` /
 * `FieldDefinition` so they hold no matter which entry point is used.
 *
 * Takes `unknown` rather than importing `CreateExtractionSchemaRequest`: that
 * DTO module transitively pulls in the clinic aggregate, which would drag
 * unrelated compilation into this module's (and its test's) import graph.
 */
export function normalizeExtractionSchemaFields(
  fields: unknown,
): FieldDefinitionInput[] {
  if (Array.isArray(fields)) {
    return fields.map((field, index) => toFieldDefinitionInput(field, index));
  }

  if (isPlainObject(fields)) {
    return Object.entries(fields).map(([name, description]) => {
      if (typeof description !== 'string') {
        throw new BadRequestException(
          `Field '${name}' must map to a description string`,
        );
      }
      return { key: name, label: name, description };
    });
  }

  throw new BadRequestException(
    'fields must be an array of field definitions or an object mapping field names to descriptions',
  );
}

function toFieldDefinitionInput(
  field: unknown,
  index: number,
): FieldDefinitionInput {
  if (!isPlainObject(field)) {
    throw new BadRequestException(`Field at index ${index} must be an object`);
  }

  // `name` is the wire-facing term (the design doc and the web app's field
  // builder both use it); the domain only knows `key`/`label`.
  const name = field.name ?? field.key ?? field.label;
  const label = field.label ?? name;

  return {
    key: asOptionalString(name, `Field at index ${index} has an invalid name`),
    label: asOptionalString(
      label,
      `Field at index ${index} has an invalid label`,
    ),
    description: field.description as string,
  };
}

function asOptionalString(value: unknown, message: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BadRequestException(message);
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
