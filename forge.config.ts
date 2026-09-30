import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

// Packages the desktop app. Forge's Vite plugin builds electron/main.ts and
// electron/preload.ts, and the game with electron/vite.renderer.config.mts,
// into .vite/, and only .vite/ goes into the app.
const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // Forge picks the extension for the platform: .icns on macOS
    icon: "electron/icon",
    appBundleId: "com.simonbw.highrise",
    appCategoryType: "public.app-category.action-games",
  },
  // macOS only for now
  makers: [new MakerZIP({}, ["darwin"])],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "electron/main.ts",
          config: "electron/vite.node.config.mts",
          target: "main",
        },
        {
          entry: "electron/preload.ts",
          config: "electron/vite.node.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        { name: "main_window", config: "electron/vite.renderer.config.mts" },
      ],
    }),
    // Turn off the Electron features the app doesn't use, before signing
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
