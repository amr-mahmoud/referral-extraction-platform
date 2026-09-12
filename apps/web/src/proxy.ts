import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import {
  isPublicRoute,
  isUnauthenticatedPreviewRoute,
  ROUTES,
} from "@/routes";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp || typeof payload.exp !== "number") {
      return false;
    }
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Route guard for every non-asset request. Redirects an unauthenticated
 * visitor away from a protected page to `/auth`, except for public routes and
 * the dashboard preview, which renders its own in-page registration gate.
 *
 * This is a UX-layer redirect only, not the sole security boundary — per
 * Next's own Proxy guidance, a Server Function reachable from an excluded path
 * still runs, so `server-actions/auth.ts` (`getMeAction`, etc.) re-checks the
 * cookie itself on every call rather than trusting that this ran first.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasValidSession = Boolean(token && !isTokenExpired(token));

  if (
    !hasValidSession &&
    !isPublicRoute(pathname) &&
    !isUnauthenticatedPreviewRoute(pathname)
  ) {
    const response = NextResponse.redirect(new URL(ROUTES.AUTH, request.url));
    if (token) {
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
    }
    return response;
  }

  // If an expired token exists on any route, clean it up from the browser
  if (token && !hasValidSession) {
    const response = NextResponse.next();
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
