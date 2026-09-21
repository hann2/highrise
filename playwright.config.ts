import { defineConfig } from "@playwright/test";

// Use a different port than the dev server so tests can run alongside it
const TEST_PORT = 3456;

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  // Benchmarks are run separately with `npm run benchmark`
  testIgnore: process.env.BENCHMARK ? [] : ["**/benchmark.spec.ts"],
  testMatch: process.env.BENCHMARK ? "**/benchmark.spec.ts" : "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    viewport: { width: 1280, height: 720 },
    // Use Chrome's "new headless" so we get a real GPU instead of software
    // rendering. Playwright's `headless: true` uses the old headless shell.
    headless: false,
    launchOptions: {
      args: ["--headless=new", "--ignore-gpu-blocklist", "--mute-audio"],
    },
  },
  webServer: {
    command: `npm run dev-server -- --port ${TEST_PORT}`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: false,
    // The first build has to process ~1400 assets
    timeout: 300000,
  },
});
