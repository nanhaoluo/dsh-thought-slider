import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  workers: 2,
  timeout: 15000,
  use: {
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL ||
      (existsSync('/Applications/Google Chrome.app') ? 'chrome' : undefined),
  },
});
