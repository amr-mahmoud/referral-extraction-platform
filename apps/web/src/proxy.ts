import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { isPublicRoute, ROUTES } from "@/routes";

/**
 * Route guard for every non-asset request. Redirects an unauthenticated
 * visitor away from a protected page to `/auth`, and an already-authenticated
 * visitor away from `/auth` to the dashboard.
 *
 * This is a UX-layer redirect only, not the sole security boundary — per
 * Next's own Proxy guidance, a Server Function reachable from an excluded path
 * still runs, so `server-actions/auth.ts` (`getMeAction`, etc.) re-checks the
 * cookie itself on every call rather than trusting that this ran first.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (!hasSession && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.AUTH, request.url));
  }

  if (hasSession && pathname === ROUTES.AUTH) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
