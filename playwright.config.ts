import { defineConfig, devices } from '@playwright/test';

// Pruebas sobre la build de producción (npm run build && npm run e2e).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4322', locale: 'es-ES', timezoneId: 'Europe/Madrid', trace: 'off' },
  webServer: { command: 'npx astro preview --port 4322', url: 'http://localhost:4322', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /movil|responsive/ },
  ],
});
