import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";

const API_BASE_URL =
  process.env.WORKBENCH_API_URL ||
  process.env.NEXT_PUBLIC_WORKBENCH_API_URL ||
  "http://localhost:8001";

// SSE is a long-lived stream — never let Next statically cache or buffer it.
export const dynamic = "force-dynamic";

/**
 * Proxies the WorkBench API's `GET /referrals/stream` SSE endpoint to the
 * browser. `EventSource` can't send an `Authorization` header itself, so this
 * route reads the httpOnly JWT cookie server-side (the same pattern every
 * other Server Action here uses) and attaches it as a Bearer token to the
 * upstream request, then pipes the upstream body straight through unbuffered.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstreamResponse = await fetch(`${API_BASE_URL}/referrals/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Referral stream unavailable", { status: 502 });
  }

  return new Response(upstreamResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
