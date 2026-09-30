# Desktop app (Electron)

Highrise ships as a desktop app, built from the same renderer bundle as the web version; the Vercel web build is unchanged. How it works is in `CLAUDE.md` (the `electron/` entry, the commands, and the gotchas). It's modelled on Depressurized's `app/`: Electron Forge with its Vite plugin, an `app://` protocol, a small preload bridge, headless/smoke modes, and a Playwright `_electron` test.

## Done (2026-09-29)

- **Parcel → Vite.** Forge's bundler plugins only cover Vite and Webpack. The switch also made the dev server start in about a second instead of Parcel's minute. The benchmark is the same on both, measured back to back: loop CPU mean 1.32 ms (Vite) vs 1.33 ms (Parcel), frame mean 2.03 vs 1.99. A production build takes under a second with the audio cache warm, against about 70 s before.
- **The shell:**
  - `electron/main.ts` and `preload.ts`, plus `forge.config.ts` (Fuses, macOS zip maker).
  - The `app://highrise` protocol, which sets `Content-Length` because the preloader reads it.
  - Navigation and window-open lockdown: links open in the system browser, which is how the Feedback button works.
  - A macOS app menu; no menu bar on other platforms.
  - Window state remembered between launches.
  - Headless, smoke and `HIGHRISE_USER_DATA` modes.
- **In the game:**
  - Quit (title screen) and Quit to Desktop (pause menu).
  - A Fullscreen: On/Off button in the pause menu.
  - No click-to-fullscreen on desktop.
  - Chromium's autoplay block turned off.
  - The `[smoke] title-ok` marker.
- **Tests:** `npm run test:electron`.
- A placeholder icon.

## Left

- **Real icon art.** Replace `electron/icon.png` and `icon.icns`. Depressurized's `build-icon.cjs` builds a Tahoe `Assets.car` from an `.icon` bundle, if we want the Liquid Glass look.
- **Signing and notarization.** Builds are unsigned for now, so macOS makes people right-click → Open. Signing needs an Apple Developer ID; Forge's `osxSign`/`osxNotarize` take it from there.
- **Windows and Linux.** Add makers (Squirrel or zip, deb/rpm) once there's a machine or CI to check them on. The main process already hides the menu bar there.
- **Where builds get published** (GitHub releases, itch.io, Steam). Decide with Philip.
- **Steam, if we go there:** steamworks.js, the overlay (which needs care with Electron's GPU process), achievements, and cloud saves. Cloud saves would move `SaveData` from localStorage to a file behind the bridge.
- **Auto-update**, if not on Steam.
- **A Content-Security-Policy.** Electron warns about it in development only. Pixi 8 needs `pixi.js/unsafe-eval` under a strict CSP, so try it before adding one.
- **Quitting mid-run doesn't record the run** (`RunStats` saves at game over). Either count it as abandoned, or ask first.
- **Rebindable controls, resolution/vsync settings and similar**, if desktop players expect more than the web version has.
