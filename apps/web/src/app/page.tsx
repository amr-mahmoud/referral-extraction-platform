import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

export default function RootPage() {
  redirect(ROUTES.AUTH);
}
