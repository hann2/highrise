// The Electron main process: one window with the game in it. The game itself
// is the same Vite build as the web version; this only hosts it, and the
// preload script (`preload.ts`) gives it the few things a page can't do itself
// (quit, real fullscreen).
//
// Environment variables:
//   HIGHRISE_HEADLESS=1  no visible window and no dock icon, muted: for tests and
//                        agents driving the app
//   HIGHRISE_SMOKE=1     headless, and quits once the title screen is up (the
//                        renderer logs SMOKE_MARKER), or fails after a timeout
//   HIGHRISE_USER_DATA   a folder to keep the save and settings in instead of
//                        the usual one, so tests never touch the real save

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  net,
  protocol,
  shell,
} from "electron";

const SMOKE = process.env.HIGHRISE_SMOKE === "1";
const HEADLESS = SMOKE || process.env.HIGHRISE_HEADLESS === "1";
const SMOKE_MARKER = "[smoke] title-ok";
const SMOKE_TIMEOUT_MS = 60_000;

/**
 * The game is served from app://highrise/ rather than file://, because
 * `fetch()` (which loads the sounds) doesn't work on file://, the build's
 * asset URLs are absolute, and localStorage (where saves live) is kept per
 * origin, so a fixed origin keeps saves across updates and wherever the app is
 * installed.
 */
const SCHEME = "app";
const ORIGIN = `${SCHEME}://highrise`;

if (SMOKE) {
  setTimeout(() => {
    process.stderr.write(`[smoke] no title within ${SMOKE_TIMEOUT_MS} ms\n`);
    app.exit(1);
  }, SMOKE_TIMEOUT_MS).unref();
}

app.setName("Highrise");
if (process.env.HIGHRISE_USER_DATA) {
  app.setPath("userData", path.resolve(process.env.HIGHRISE_USER_DATA));
}

// Chromium only lets pages start audio after a click or key press. That stops
// web pages from making noise on their own; here it would only hold up the
// game's audio until the first key press.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
if (HEADLESS) {
  app.commandLine.appendSwitch("mute-audio");
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
    },
  },
]);

/** The window's settings that last between launches */
interface WindowState {
  fullscreen: boolean;
  bounds?: Electron.Rectangle;
}

const windowStateFile = () =>
  path.join(app.getPath("userData"), "window-state.json");

function loadWindowState(): WindowState {
  try {
    const state = JSON.parse(fs.readFileSync(windowStateFile(), "utf8"));
    return { fullscreen: state.fullscreen !== false, bounds: state.bounds };
  } catch {
    return { fullscreen: true };
  }
}

function saveWindowState(window: BrowserWindow) {
  const state: WindowState = {
    fullscreen: window.isFullScreen(),
    bounds: window.isFullScreen()
      ? loadWindowState().bounds
      : window.getBounds(),
  };
  try {
    fs.writeFileSync(windowStateFile(), JSON.stringify(state));
  } catch (e) {
    console.warn("Couldn't save the window state", e);
  }
}

/**
 * `key=value` (or bare `key`) arguments become the page's query string, so
 * `npm run electron -- play=chad floor=5` works like `?play=chad&floor=5`.
 */
function queryFromArgs(): string {
  const params = new URLSearchParams();
  for (const arg of process.argv.slice(app.isPackaged ? 1 : 2)) {
    const match = /^([a-zA-Z]\w*)(?:=(.*))?$/.exec(arg);
    if (match) {
      params.set(match[1], match[2] ?? "");
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function createWindow() {
  const state = loadWindowState();
  const window = new BrowserWindow({
    width: state.bounds?.width ?? 1280,
    height: state.bounds?.height ?? 800,
    x: state.bounds?.x,
    y: state.bounds?.y,
    minWidth: 640,
    minHeight: 400,
    fullscreen: state.fullscreen && !HEADLESS,
    backgroundColor: "#000000",
    title: "Highrise",
    show: !HEADLESS,
    // A hidden window would otherwise never paint, and be throttled to a crawl
    paintWhenInitiallyHidden: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      additionalArguments: SMOKE ? ["--highrise-smoke"] : [],
    },
  });

  window.on("enter-full-screen", () => {
    window.webContents.send("highrise:fullscreen", true);
    saveWindowState(window);
  });
  window.on("leave-full-screen", () => {
    window.webContents.send("highrise:fullscreen", false);
    saveWindowState(window);
  });
  window.on("close", () => saveWindowState(window));

  // Renderer console output goes to stdout, so the app can be watched from a
  // terminal (and the smoke test can see the title come up)
  window.webContents.on("console-message", (event) => {
    process.stdout.write(`[renderer:${event.level}] ${event.message}\n`);
    if (SMOKE && event.message.includes(SMOKE_MARKER)) {
      setTimeout(() => app.quit(), 50);
    }
  });

  // There's nothing but the game to show, so any navigation away from it is a
  // mistake, and links open in the real browser
  const devServerUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL;
  window.webContents.on("will-navigate", (event, url) => {
    const ours =
      url.startsWith(ORIGIN) || (devServerUrl && url.startsWith(devServerUrl));
    if (!ours) {
      event.preventDefault();
    }
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const query = queryFromArgs();
  if (devServerUrl) {
    window.loadURL(`${devServerUrl}/${query}`);
  } else {
    window.loadURL(`${ORIGIN}/index.html${query}`);
  }
  return window;
}

/** Serves the built game (`.vite/renderer/main_window`) at app://highrise/ */
function serveGame() {
  const root = path.join(__dirname, "..", "renderer", MAIN_WINDOW_VITE_NAME);
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.resolve(root, "." + decodeURIComponent(pathname));
    if (!filePath.startsWith(root + path.sep)) {
      return new Response("Forbidden", { status: 403 });
    }
    const response = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    // The preloader reads this to report how much audio it loaded
    if (response.ok && !headers.has("Content-Length")) {
      headers.set("Content-Length", String(fs.statSync(filePath).size));
    }
    return new Response(response.body, { status: response.status, headers });
  });
}

function buildMenu() {
  if (process.platform !== "darwin") {
    // Windows and Linux: no menu bar at all
    Menu.setApplicationMenu(null);
    return;
  }
  const template: MenuItemConstructorOptions[] = [
    { role: "appMenu" },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        ...(app.isPackaged
          ? []
          : ([
              { type: "separator" },
              { role: "reload" },
              { role: "toggleDevTools" },
            ] as MenuItemConstructorOptions[])),
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on("highrise:quit", () => app.quit());
ipcMain.on("highrise:set-fullscreen", (event, fullscreen: boolean) => {
  BrowserWindow.fromWebContents(event.sender)?.setFullScreen(fullscreen);
});
ipcMain.on("highrise:is-fullscreen", (event) => {
  event.returnValue =
    BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false;
});

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    if (HEADLESS) {
      app.dock.hide();
    } else if (!app.isPackaged) {
      // In development the app is Electron's own bundle, with Electron's icon
      app.dock.setIcon(
        path.join(__dirname, "..", "..", "electron", "icon.png"),
      );
    }
  }
  buildMenu();
  serveGame();
  createWindow();
});

// A game has nothing to do without its window, on macOS too
app.on("window-all-closed", () => app.quit());
