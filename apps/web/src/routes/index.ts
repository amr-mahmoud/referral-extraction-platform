import type { AuthMode } from "@/constants/auth";

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  REFERRALS: "/referrals",
  ABOUT: "/about",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes reachable without an authenticated clinic session. */
export const PUBLIC_ROUTES: readonly Route[] = [
  ROUTES.HOME,
  ROUTES.AUTH,
  ROUTES.ABOUT,
];

/**
 * Authenticated routes an unauthenticated visitor may still render so the page
 * can show an in-page registration gate instead of being redirected away. The
 * data on these pages is still fetched server-side behind the session check.
 */
export const UNAUTHENTICATED_PREVIEW_ROUTES: readonly Route[] = [
  ROUTES.DASHBOARD,
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isUnauthenticatedPreviewRoute(pathname: string): boolean {
  return UNAUTHENTICATED_PREVIEW_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Builds `/auth?mode={mode}` so a CTA can deep-link straight to sign-in or sign-up. */
export function authRouteWithMode(mode: AuthMode): string {
  return `${ROUTES.AUTH}?mode=${encodeURIComponent(mode)}`;
}

/** Dynamic review-screen path: `/referrals/{id}`. */
export function referralDetailRoute(referralId: string): string {
  return `${ROUTES.REFERRALS}/${encodeURIComponent(referralId)}`;
}

export interface NavItem {
  label: string;
  href: Route;
}

/** Primary navigation shown in the workbench header. */
export const WORKBENCH_NAV_ITEMS: readonly NavItem[] = [
  { label: "Referrals", href: ROUTES.DASHBOARD },
  { label: "About", href: ROUTES.ABOUT },
];
