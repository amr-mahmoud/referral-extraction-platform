export const ROUTES = {
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  REFERRALS: "/referrals",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes reachable without an authenticated clinic session. */
export const PUBLIC_ROUTES: readonly Route[] = [ROUTES.AUTH];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
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
];
