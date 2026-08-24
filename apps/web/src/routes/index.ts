export const ROUTES = {
  AUTH: "/auth",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes reachable without an authenticated clinic session. */
export const PUBLIC_ROUTES: readonly Route[] = [ROUTES.AUTH];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
