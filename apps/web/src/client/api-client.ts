import createClient from "openapi-fetch";
import type { paths } from "@/types/api.generated";

const API_BASE_URL =
  process.env.WORKBENCH_API_URL ||
  process.env.NEXT_PUBLIC_WORKBENCH_API_URL ||
  "http://localhost:8001";

/**
 * Shared openapi-fetch client typed with auto-generated WorkBench API paths.
 */
export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});
