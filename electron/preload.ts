// The only bridge between the game and Electron. The page runs with context
// isolation and without Node, so `window.desktop` is all it can reach;
// keep it small. `src/core/desktop.ts` is the game's side of it, and says what
// each of these is for.

import { contextBridge, ipcRenderer } from "electron";

let fullscreen = ipcRenderer.sendSync("highrise:is-fullscreen") as boolean;
ipcRenderer.on("highrise:fullscreen", (_, value: boolean) => {
  fullscreen = value;
});

let displayFrequency = ipcRenderer.sendSync(
  "highrise:display-frequency",
) as number;
ipcRenderer.on("highrise:display-frequency", (_, value: number) => {
  displayFrequency = value;
});

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  smoke: process.argv.includes("--highrise-smoke"),
  quit: () => ipcRenderer.send("highrise:quit"),
  isFullscreen: () => fullscreen,
  displayFrequency: () => displayFrequency,
  setFullscreen: (value: boolean) =>
    ipcRenderer.send("highrise:set-fullscreen", value),
});
