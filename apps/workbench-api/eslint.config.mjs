// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    // Clean Architecture boundary: the interface layer (controllers, guards,
    // DTOs) may depend on the application layer's ports, never on a concrete
    // infrastructure adapter directly — that inverts the dependency rule and
    // makes the controller untestable without booting the real adapter (this
    // caught exactly that: `clinics.controller.ts` importing
    // `PostgresListenService` straight from `infrastructure/`, bypassing
    // `ReferralNotificationPort`). Module wiring (`interface.module.ts`
    // importing `InfrastructureModule` to compose providers) is the
    // composition root's job and is exempted below.
    files: ['src/interface/**/*.ts'],
    ignores: ['src/interface/interface.module.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'Interface layer must depend on an application-layer port (application/ports/*), not a concrete infrastructure adapter. Inject by the port token instead.',
            },
          ],
        },
      ],
    },
  },
);
