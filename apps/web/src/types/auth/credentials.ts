/**
 * Hand-written for now. Once the WorkBench API publishes its OpenAPI document
 * these become the generated `openapi-typescript` request models.
 */

export interface SignInCredentials {
  clinicName: string;
  username: string;
  password: string;
  rememberSession: boolean;
}

export interface SignUpCredentials {
  clinicName: string;
  username: string;
  password: string;
  confirmPassword: string;
}
