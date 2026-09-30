import path from "node:path";
import { mergeConfig } from "vite";
import gameConfig from "../vite.config.mjs";

// The desktop app's game is the web build (vite.config.mts), with its own dev
// server and output folder for Forge
export default mergeConfig(gameConfig, {
  server: {
    // Not 1234, so it can run next to `npm start`
    port: 1236,
    strictPort: false,
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "../.vite/renderer/main_window"),
  },
});
