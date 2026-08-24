"use server";

import { fetchSavedSchemas } from "@/client/mock-api";
import type { SavedSchema } from "@/types/extraction-schemas/schema";

export async function getSavedSchemas(): Promise<readonly SavedSchema[]> {
  return fetchSavedSchemas();
}
