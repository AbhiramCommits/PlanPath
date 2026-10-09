import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter server db:push && pnpm --filter server seed && pnpm --filter server dev',
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          `postgresql://${process.env.USER}@localhost:5432/planpath_dev?schema=public`,
      },
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter client dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
