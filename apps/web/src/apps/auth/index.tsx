import { AuthBrandPanel } from "@/features/auth/AuthBrandPanel";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { AuthLayout } from "@/layouts/AuthLayout";

/**
 * Entry point for `/auth`.
 * Renders the authentication layout with AuthBrandPanel and AuthPanel,
 * backed by domain server hooks (`useLogin`, `useSignup`) and server actions.
 */
export function AuthApp() {
  return (
    <AuthLayout brand={<AuthBrandPanel />}>
      <AuthPanel />
    </AuthLayout>
  );
}
