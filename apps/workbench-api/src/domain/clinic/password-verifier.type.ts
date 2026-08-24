/**
 * Pure function type that the domain uses to verify a plain-text password
 * against a hashed credential. Injected from the application layer so the
 * domain never imports infrastructure (bcrypt, argon2, etc.).
 */
export type PasswordVerifier = (
  plainText: string,
  hashedText: string,
) => Promise<boolean>;
