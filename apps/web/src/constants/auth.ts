export const AUTH_MODES = {
  SIGN_IN: "sign-in",
  SIGN_UP: "sign-up",
} as const;

export type AuthMode = (typeof AUTH_MODES)[keyof typeof AUTH_MODES];

export const AUTH_MODE_LABELS: Record<AuthMode, string> = {
  [AUTH_MODES.SIGN_IN]: "Sign in",
  [AUTH_MODES.SIGN_UP]: "Sign up",
};

/** Order the modes appear in the segmented toggle. */
export const AUTH_MODE_ORDER: readonly AuthMode[] = [
  AUTH_MODES.SIGN_IN,
  AUTH_MODES.SIGN_UP,
];

export const AUTH_MODE_HEADINGS: Record<AuthMode, string> = {
  [AUTH_MODES.SIGN_IN]: "Sign in to your clinic",
  [AUTH_MODES.SIGN_UP]: "Create your clinic account",
};

/** Parses the `?mode=` query value into a known auth mode, defaulting to sign-in. */
export function parseAuthMode(value: string | undefined): AuthMode {
  return value === AUTH_MODES.SIGN_UP ? AUTH_MODES.SIGN_UP : AUTH_MODES.SIGN_IN;
}

/** Label for the guest header CTA that routes straight to the sign-up form. */
export const AUTH_GUEST_REGISTER_LABEL = "Register";

/**
 * Copy for the registration gate shown over the dashboard when a visitor is
 * not signed in. Kept here (not inline in the component) so the wording is a
 * single source and reusable by any future gated surface.
 */
export const AUTH_REQUIRED_DIALOG = {
  eyebrow: "Demo access",
  title: "Registration required",
  message:
    "Please sign in or create a demo clinic account to access the extraction workbench and review referral documents.",
  registerLabel: "Create an account",
  signInLabel: "Sign in",
} as const;

/** Minimum password length accepted by the sign-up form. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Cookie the signed JWT is persisted under. Shared between `server-actions/auth.ts`
 * (which sets/reads it) and `proxy.ts` (which reads it to gate protected routes) —
 * a single source so the two never drift on the name.
 */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Cookie lifetime, mirrored from the API's default `JWT_EXPIRES_IN` (`.env.example`). */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
