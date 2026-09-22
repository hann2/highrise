import { expect, Page } from "@playwright/test";

/** Collects page errors and console errors so tests can assert there are none. */
export function collectIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      issues.push(`console.error: ${msg.text()}`);
    }
  });
  return issues;
}

/** Loads the game with a fixed seed and waits for the main menu. */
export async function loadGame(page: Page, seed: number) {
  // Skip the tutorial level so we get a normal generated level
  await page.addInitScript(() => {
    window.localStorage.setItem("tutorialComplete", "true");
  });
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(() => window.DEBUG?.game, null, {
    timeout: 60000,
  });
  // Main menu only shows up once preloading is done
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "MainMenu",
      ),
    null,
    { timeout: 120000 },
  );
}

/** Starts a new game from the main menu and waits for the level to exist. */
export async function startGame(page: Page) {
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => {
      const entities = window.DEBUG.game!.entities;
      return (
        entities.getTagged("human").length > 0 &&
        entities.getTagged("zombie").length > 0
      );
    },
    null,
    { timeout: 30000 },
  );
}

export async function getLeaderPosition(page: Page): Promise<[number, number]> {
  return page.evaluate(() => {
    const partyManager = [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "PartyManager",
    ) as any;
    const [x, y] = partyManager.leader.body.position;
    return [x, y] as [number, number];
  });
}

export async function getLevelNumber(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "LevelController",
        ) as any
      ).currentLevel,
  );
}

export function expectNoIssues(issues: string[]) {
  expect(issues, issues.join("\n")).toHaveLength(0);
}
