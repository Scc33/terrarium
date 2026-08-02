import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    channel: process.platform === 'darwin' ? 'chrome' : undefined,
  },
  webServer: {
    command: 'pnpm --filter @terrarium/ui exec vite --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
