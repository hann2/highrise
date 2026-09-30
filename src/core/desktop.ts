/**
 * What the desktop app (Electron, see `electron/`) adds to the page, through
 * its preload script. On the web there's no bridge and `desktop` is undefined,
 * so every use has to work without it.
 */
export interface DesktopBridge {
  /** `process.platform` of the machine, e.g. "darwin" or "win32" */
  readonly platform: string;
  /** Launched as a smoke test, which ends once the game shows it's up */
  readonly smoke: boolean;
  /** Closes the app */
  quit(): void;
  /** Whether the window is fullscreen (the real kind, not the HTML one) */
  isFullscreen(): boolean;
  setFullscreen(fullscreen: boolean): void;
  /** The refresh rate (Hz) of the display the window is on, or 0 if it's unknown */
  displayFrequency(): number;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

/** The desktop app's bridge, or undefined in a browser */
export const desktop: DesktopBridge | undefined =
  typeof window === "undefined" ? undefined : window.desktop;
