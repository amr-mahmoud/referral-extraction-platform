import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";
import { getAuthenticatedClinic } from "@/server-actions/auth";

/**
 * Session-aware entry point: signed-in clinics land on the dashboard, while
 * guests are sent to the public About page so the product is discoverable
 * before they register.
 */
export default async function RootPage() {
  const clinic = await getAuthenticatedClinic();

  redirect(clinic ? ROUTES.DASHBOARD : ROUTES.ABOUT);
}
