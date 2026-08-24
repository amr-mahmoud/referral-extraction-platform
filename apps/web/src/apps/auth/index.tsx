import { AuthBrandPanel } from "@/features/auth/AuthBrandPanel";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { AuthLayout } from "@/layouts/AuthLayout";

/**
 * Entry point for `/auth`. Submitting is intentionally not wired yet: the
 * WorkBench API has no auth endpoints, so the credential handlers land in
 * `server-hooks/auth/` (`useLogin`) once `/auth/login` exists — see
 * `.agent/rules/frontend-workflow-architecture.md`.
 */
export function AuthApp() {
  return (
    <AuthLayout brand={<AuthBrandPanel />}>
      <AuthPanel />
    </AuthLayout>
  );
}
