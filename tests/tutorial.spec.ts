import { expect, test } from "@playwright/test";
import { collectIssues, expectNoIssues, loadGame } from "./helpers";

/** Which of the flow's entities exist right now */
async function flowState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const game = window.DEBUG.game!;
    const named = (name: string) =>
      [...game.entities.all].filter(
        (e) => e.constructor.name === name,
      ) as any[];
    return {
      lobby: !!game.entities.getById("lobby"),
      levels: named("LevelController").map((c) => c.currentLevel as number),
      gameOver: named("GameOverScreen").length,
      pauseMenus: named("PauseMenu").map((m) => m.place as string),
      tutorialComplete: localStorage.getItem("tutorialComplete"),
    };
  });
}

test("the first start plays the tutorial, which goes on to the lobby", async ({
  page,
}) => {
  const issues = collectIssues(page);
  await loadGame(page, 12345, { tutorial: true });
  await page.waitForTimeout(1000); // let the title fade in

  // --- Enter at the title starts the tutorial, not the lobby ---
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "LevelController",
      ),
    null,
    { timeout: 10000 },
  );
  expect(await flowState(page)).toEqual({
    lobby: false,
    levels: [0],
    gameOver: 0,
    pauseMenus: ["tutorial"],
    tutorialComplete: null,
  });

  // --- Dying in the tutorial starts it over, with no run summary ---
  const firstController = await page.evaluateHandle(() =>
    [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "LevelController",
    ),
  );
  await page.evaluate(() =>
    window.DEBUG.game!.dispatch("partyDead", undefined),
  );
  await page.waitForFunction(
    (first) => {
      const controllers = [...window.DEBUG.game!.entities.all].filter(
        (e) => e.constructor.name === "LevelController",
      );
      return controllers.length === 1 && controllers[0] !== first;
    },
    firstController,
    { timeout: 10000 },
  );
  expect(await flowState(page)).toEqual({
    lobby: false,
    levels: [0],
    gameOver: 0,
    pauseMenus: ["tutorial"],
    tutorialComplete: null,
  });

  // --- Finishing the tutorial goes up to the lobby, on the long ride ---
  await page.evaluate(() =>
    window.DEBUG.game!.dispatch("levelComplete", undefined),
  );
  await page.waitForFunction(
    () => !!window.DEBUG.game!.entities.getById("lobby"),
    null,
    { timeout: 10000 },
  );
  await page.waitForFunction(
    () => (window.DEBUG.game!.entities.getById("lobby") as any)?.arrived,
    null,
    { timeout: 30000 },
  );
  expect(await flowState(page)).toEqual({
    lobby: true,
    levels: [],
    gameOver: 0,
    pauseMenus: ["lobby"],
    tutorialComplete: "true",
  });
  expect(
    await page.evaluate(
      () => (window.DEBUG.game!.entities.getById("lobby") as any).arrival,
    ),
  ).toBe("fromTitle");
  expectNoIssues(issues);
});
