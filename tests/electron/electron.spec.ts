import { _electron as electron, expect, Page, test } from "@playwright/test";
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { arriveInLobby, collectIssues, expectNoIssues } from "../helpers";

/*
 * The desktop app, built by `npm run package` (which `npm run test:electron`
 * runs first). Each launch gets its own user data folder, so the tests never
 * touch the real save.
 */

const ROOT = path.resolve(__dirname, "../..");
const MAIN = path.join(ROOT, ".vite/build/main.cjs");
const PACKAGED = path.join(
  ROOT,
  `out/Highrise-darwin-${process.arch}/Highrise.app/Contents/MacOS/Highrise`,
);

function newUserData(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "highrise-electron-test-"));
}

/** Launches the built app (not the packaged one) hidden, and waits for the title */
async function launch(userData: string) {
  const app = await electron.launch({
    args: [MAIN],
    cwd: ROOT,
    env: {
      ...process.env,
      HIGHRISE_HEADLESS: "1",
      HIGHRISE_USER_DATA: userData,
    },
  });
  const page = await app.firstWindow();
  const issues = collectIssues(page);
  // A sound or image that doesn't load is only a warning in the preloader
  page.on("console", (message) => {
    if (/failed to load/i.test(message.text())) {
      issues.push(`${message.type()}: ${message.text()}`);
    }
  });
  await waitForTitle(page);
  return { app, page, issues };
}

async function waitForTitle(page: Page) {
  await page.waitForFunction(
    () =>
      [...(window.DEBUG?.game?.entities.all ?? [])].some(
        (e) => e.constructor.name === "TitleScreen",
      ),
    null,
    { timeout: 60000 },
  );
}

test("the desktop app boots, plays, keeps its save, and quits", async () => {
  expect(fs.existsSync(MAIN), `${MAIN} is missing: run npm run package`).toBe(
    true,
  );
  const userData = newUserData();

  // First launch: a new save
  let { app, page, issues } = await launch(userData);
  expect(page.url()).toMatch(/^app:\/\/highrise\//);
  const bridge = await page.evaluate(() => ({
    platform: window.desktop?.platform,
    smoke: window.desktop?.smoke,
    // Headless windows are never fullscreen
    fullscreen: window.desktop?.isFullscreen(),
  }));
  expect(bridge).toEqual({
    platform: process.platform,
    smoke: false,
    fullscreen: false,
  });
  await page.evaluate(() => {
    window.localStorage.setItem("tutorialComplete", "true");
    window.localStorage.setItem("electronTest", "kept");
  });
  await app.close();
  expectNoIssues(issues);

  // Second launch: the save is still there, and the game plays
  ({ app, page, issues } = await launch(userData));
  expect(
    await page.evaluate(() => window.localStorage.getItem("electronTest")),
  ).toBe("kept");
  await arriveInLobby(page);

  // The pause menu's Quit to Desktop closes the app
  await page.keyboard.press("Escape");
  const closed = app.waitForEvent("close");
  await page.getByText("Quit to Desktop").click();
  await closed;
  expectNoIssues(issues);
  fs.rmSync(userData, { recursive: true, force: true });
});

test("the packaged app gets to the title screen", async () => {
  test.skip(
    process.platform !== "darwin",
    "The app is only packaged for macOS",
  );
  expect(fs.existsSync(PACKAGED), `${PACKAGED} is missing`).toBe(true);
  const userData = newUserData();
  // In smoke mode the app quits by itself once the title is up (exit code 0)
  // or after a timeout (1). Playwright can't drive the packaged app, whose
  // fuses turn off the debugging it needs.
  const result = spawnSync(PACKAGED, [], {
    env: { ...process.env, HIGHRISE_SMOKE: "1", HIGHRISE_USER_DATA: userData },
    encoding: "utf8",
    timeout: 90000,
  });
  fs.rmSync(userData, { recursive: true, force: true });
  const errors = result.stdout
    .split("\n")
    .filter((line) => /^\[renderer:error\]|failed to load/i.test(line));
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("[smoke] title-ok");
  expect(errors, errors.join("\n")).toEqual([]);
});
