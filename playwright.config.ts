import { defineConfig, devices } from '@playwright/test'

const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined)

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    ...(chromePath ? { launchOptions: { executablePath: chromePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'breakpoint-wide', use: { ...devices['Desktop Chrome'], viewport: { width: 861, height: 700 } } },
    { name: 'breakpoint-narrow', use: { ...devices['Desktop Chrome'], viewport: { width: 860, height: 700 } } },
    { name: 'mobile-large', use: { ...devices['Pixel 7'], viewport: { width: 430, height: 932 } } },
    { name: 'mobile-small', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'pnpm preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
