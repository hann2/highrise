import { defineConfig } from "@playwright/test";

// Use a different port than the dev server so tests can run alongside it.
// TEST_PORT overrides it so several checkouts can run tests at the same time.
const TEST_PORT = Number(process.env.TEST_PORT ?? 3456);

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  // Benchmarks are run separately with `npm run benchmark`, and the desktop
  // app with `npm run test:electron`
  testIgnore: [
    "**/electron/**",
    ...(process.env.BENCHMARK ? [] : ["**/*benchmark.spec.ts"]),
  ],
  testMatch: process.env.BENCHMARK ? "**/*benchmark.spec.ts" : "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    viewport: { width: 1280, height: 720 },
    // Use Chrome's "new headless" so we get a real GPU instead of software
    // rendering. Playwright's `headless: true` uses the old headless shell.
    headless: false,
    launchOptions: {
      args: [
        "--headless=new",
        "--ignore-gpu-blocklist",
        "--mute-audio",
        // Benchmarks run without vsync so that frame intervals measure the
        // whole CPU + GPU frame instead of being capped at the refresh rate
        ...(process.env.BENCHMARK
          ? ["--disable-gpu-vsync", "--disable-frame-rate-limit"]
          : []),
      ],
    },
  },
  webServer: {
    command: `npm run dev-server -- --port ${TEST_PORT}`,
    url: `http://localhost:${TEST_PORT}`,
    // TEST_REUSE_SERVER=1 runs against a dev server you started yourself on
    // TEST_PORT
    reuseExistingServer: process.env.TEST_REUSE_SERVER === "1",
    timeout: 60000,
  },
});
