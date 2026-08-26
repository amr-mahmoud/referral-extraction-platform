"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/client/api-client";
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import type { components } from "@/types/api.generated";
import type { SavedSchema } from "@/types/extraction-schemas/schema";
import type { ActionResult } from "@/types/server-action";

export type SchemaFieldInput = components["schemas"]["SchemaFieldDefinitionDto"];
export type ExtractionSchemaDto = components["schemas"]["ExtractionSchemaDto"];

/** The API serves the version title; fall back to the bare `v{n}` label only if it's somehow absent. */
function toSavedSchema(dto: ExtractionSchemaDto): SavedSchema {
  return {
    id: dto.id,
    name: dto.title ?? `Custom schema v${dto.version}`,
    fieldCount: dto.fields.length,
  };
}

/**
 * Server Action: List every extraction schema the signed-in clinic has
 * published, newest first. Backs the "Saved schema" dropdown — the clinic can
 * only select a schema that's actually in the database, so this is the only
 * source that list is ever built from. Reads `GET /extraction-schemas`,
 * which needs no parameters beyond the clinic id the JWT already carries.
 */
export async function getSavedSchemas(): Promise<readonly SavedSchema[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return [];

  try {
    const { data, response } = await apiClient.GET("/extraction-schemas", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !data) return [];

    return [...data].reverse().map(toSavedSchema);
  } catch {
    // A temporarily-unreachable API must never crash the dashboard — the
    // upload panel simply renders with no saved schemas until it recovers.
    return [];
  }
}

export interface CreateExtractionSchemaInput {
  /** Version name shown in the dashboard; the backend falls back to `Custom schema v{n}`. */
  title: string;
  fields: SchemaFieldInput[];
}

/**
 * Server Action: Publish a new extraction schema version for the signed-in
 * clinic. Backs both "Upload schema JSON" (fields already normalised
 * client-side by `validateExtractionSchemaJson`) and "Build fields in the
 * app" — same endpoint, same shape, the only difference is who produced the
 * field list. There is no unpublished/local-only schema: every confirmed
 * field set becomes a real, selectable row the moment this succeeds.
 */
export async function createExtractionSchemaAction(
  input: CreateExtractionSchemaInput,
): Promise<ActionResult<ExtractionSchemaDto>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error, response } = await apiClient.POST(
      "/extraction-schemas",
      {
        headers: { Authorization: `Bearer ${token}` },
        body: { title: input.title, fields: input.fields },
      },
    );

    // `!response.ok` rather than narrowing on `error` — openapi-fetch's
    // response type collapses `response` to `never` under `if (error)` here,
    // specifically because this endpoint's request body is a union type
    // (`SchemaFieldDefinitionDto[] | Record<string, string>`).
    if (!response.ok || !data) {
      return {
        success: false,
        error: getApiErrorMessage(
          error,
          `Failed to save schema (${response.status})`,
        ),
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save schema",
    };
  }
}
