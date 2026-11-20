import { defineConfig, devices } from "@playwright/test"

// E2E runs against the production build (`pnpm build` first) on port 3200.
// Three viewports: desktop, phone (Pixel 7) and tablet (iPad Mini, run in
// Chromium). Backend and axe specs run on desktop only; layout.spec is touch-only.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3200" },
  webServer: {
    command: "pnpm start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], permissions: ["clipboard-read", "clipboard-write"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: [/api\.spec\.ts/, /a11y\.spec\.ts/],
    },
    {
      name: "tablet",
      use: { ...devices["iPad Mini"], browserName: "chromium" },
      testIgnore: [/api\.spec\.ts/, /a11y\.spec\.ts/],
    },
  ],
})
