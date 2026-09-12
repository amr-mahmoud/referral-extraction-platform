import type { AuthMode } from "@/constants/auth";
import { AuthBrandPanel } from "@/features/auth/AuthBrandPanel";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { AuthLayout } from "@/layouts/AuthLayout";

export interface AuthAppProps {
  /** Mode the panel opens on — lets `/auth?mode=sign-up` deep-link straight to registration. */
  initialMode?: AuthMode;
}

/**
 * Entry point for `/auth`.
 * Renders the authentication layout with AuthBrandPanel and AuthPanel,
 * backed by domain server hooks (`useLogin`, `useSignup`) and server actions.
 */
export function AuthApp({ initialMode }: AuthAppProps) {
  return (
    <AuthLayout brand={<AuthBrandPanel />}>
      <AuthPanel key={initialMode} initialMode={initialMode} />
    </AuthLayout>
  );
}
