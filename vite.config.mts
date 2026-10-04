import path from "node:path";
import { defineConfig } from "vite";
import { encodeAudio } from "./vite-plugins/encodeAudio.mjs";
import { plainManifestUrls } from "./vite-plugins/plainManifestUrls.mjs";

// The pages live in src/: the game at /, and in development the character
// editor at /tools/character-editor/. Assets come from resources/, outside
// that root.
export default defineConfig({
  root: "src",
  // Absolute asset URLs, which the Electron app's app:// protocol serves from
  // the root of dist/
  base: "/",
  publicDir: false,
  plugins: [encodeAudio(import.meta.dirname), plainManifestUrls()],
  server: {
    port: 1234,
    strictPort: true,
    // The game can't hot swap modules, and a reload in the middle of playing
    // is worse than reloading by hand
    hmr: false,
    watch: {
      // The manifest watcher regenerates resources/resources.ts itself; the
      // rest of resources/ is only ever loaded by URL
      ignored: ["**/resources/{audio,images,fonts}/**"],
    },
    fs: {
      allow: [".."],
    },
    // The character editor's server (on `CHARACTER_EDITOR_PORT`, as it is)
    proxy: {
      "/api": `http://127.0.0.1:${process.env.CHARACTER_EDITOR_PORT ?? 1235}`,
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // One file per asset, never inlined, the same as every other asset
    assetsInlineLimit: 0,
    rolldownOptions: {
      // The character editor is development only
      input: path.resolve(import.meta.dirname, "src/index.html"),
      // Class names show up in the profiler and in error messages
      output: { keepNames: true },
    },
  },
});
