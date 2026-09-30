import { defineConfig } from "@playwright/test";

// The desktop app's tests (`npm run test:electron`, which packages the app
// first). They launch Electron themselves, so there's no web server.
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 120000,
  workers: 1,
});
