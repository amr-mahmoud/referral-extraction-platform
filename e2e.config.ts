import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { opencodeConsole } from 'e2e/oauth/opencode-console';

export default {
  // Your OpenCode Console workspace serves the model; sign in once with `e2e login opencode-console`, `e2e models opencode-console` lists the ids.
  agents: {
    default: {
      model: opencodeConsole('deepseek-v4.1-flash'),
      system: 'You are a thorough QA agent. Verify every outcome.',
    },
  },
  // Test clinic account for the upload flow. Override with E2E_USER_CLINIC_USERNAME / E2E_USER_CLINIC_PASSWORD.
  credentials: {
    clinic: { username: 'amrhazem2525', password: '12345678' },
  },
  targets: [{
    engine: web(),
    app: {
      url: process.env.APP_URL ?? 'http://localhost:3000',
      // Or let the runner start the dev server:
      // command: { executable: 'npm', args: ['run', 'dev'] },
    },
  }],
} satisfies E2EConfig;
