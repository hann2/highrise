import { expect, Page, test } from "@playwright/test";
import { collectIssues, expectNoIssues } from "./helpers";

// The boss test scene (?scene=boss): one boss level as a practice run, with a
// loadout from the URL, the setup panel, starting over, winning and dying

const URL =
  "/?scene=boss&seed=5&boss=necromancer&char=chad&weapons=ar15,glock" +
  "&items=nightvision&quarters=30";

function scene(page: Page) {
  return page.evaluate(() => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const scene = game.entities.getById("bossTestScene") as any;
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const levelController = game.entities.getTagged(
      "level_controller",
    )[0] as any;
    return {
      floor: levelController.currentLevel as number,
      floorName: levelController.floor.name as string,
      character: leader.character.name as string,
      weapons: leader.weapons.map((w: any) => w?.stats.name ?? null),
      items: leader.items.map((i: any) => i.name) as string[],
      quarters: entities.find((e) => e.constructor.name === "PartyManager")
        .quarters as number,
      bossHp: (game.entities.getTagged("boss") as any[]).map((e) => e.hp),
      fights: game.entities.getTagged("boss_fight").length,
      humans: game.entities.getTagged("human").length,
      // A practice run keeps no score and has no pause menu
      runStats: entities.some((e) => e.constructor.name === "RunStats"),
      pauseMenu: entities.some((e) => e.constructor.name === "PauseMenu"),
      outcome: scene.lastAttempt?.outcome as string | undefined,
      search: location.search,
    };
  });
}

/** How many times the fight has started over */
function restarts(page: Page): Promise<number> {
  return page.evaluate(
    () => (window.DEBUG.game!.entities.getById("bossTestScene") as any).cycles,
  );
}

/** Waits until the fight has started over since there had been `before` restarts */
async function waitForRestart(page: Page, before: number) {
  await page.waitForFunction(
    (before) => {
      const game = window.DEBUG.game!;
      const scene = game.entities.getById("bossTestScene") as any;
      return (
        scene.cycles > before &&
        game.entities.getTagged("boss").length === 1 &&
        game.entities.getTagged("boss_fight").length === 1
      );
    },
    before,
    { timeout: 10000 },
  );
}

test("boss test scene", async ({ page }) => {
  const issues = collectIssues(page);
  await page.addInitScript(() =>
    window.localStorage.setItem("tutorialComplete", "true"),
  );
  await page.goto(URL);
  await page.waitForFunction(
    () =>
      window.DEBUG?.game?.entities.getById("bossTestScene") &&
      (
        [...window.DEBUG.game.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      )?.leader.items.length > 0,
    null,
    { timeout: 120000 },
  );
  await waitForRestart(page, 0);

  // The loadout, on the boss floor whose pool has the Necromancer (10), with
  // the URL filled in
  let state = await scene(page);
  expect(state).toMatchObject({
    floor: 10,
    floorName: "Chapel",
    character: "Chad",
    weapons: ["AR-15", "Glock"],
    items: ["Night Vision"],
    quarters: 30,
    bossHp: [2000],
    fights: 1,
    humans: 1,
    runStats: false,
    pauseMenu: false,
  });
  expect(state.search).toContain("floor=10");
  await page.screenshot({ path: "tests/output/boss-scene.png" });

  // The setup panel: applying the same boss on floor 5 starts it over there,
  // as tough as on 10 (nothing on a boss level scales with the act), and
  // rewrites the URL
  let before = await restarts(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".arena-panel")).toHaveCount(1);
  await page.screenshot({ path: "tests/output/boss-scene-panel.png" });
  await page
    .locator(".arena-row", { hasText: "Floor" })
    .getByRole("button", { name: "5", exact: true })
    .click();
  await page.keyboard.press("Tab");
  await expect(page.locator(".arena-panel")).toHaveCount(0);
  await waitForRestart(page, before);
  state = await scene(page);
  expect(state).toMatchObject({
    floor: 5,
    floorName: "Chapel",
    weapons: ["AR-15", "Glock"],
    bossHp: [2000],
    humans: 1,
  });
  expect(state.search).toContain("floor=5");

  // The boss's health can be set in the middle of the fight
  await page.keyboard.press("Tab");
  await page
    .locator(".arena-row", { hasText: "Boss health" })
    .getByRole("button", { name: "Half" })
    .click();
  await page.keyboard.press("Escape");
  expect((await scene(page)).bossHp).toEqual([1000]);

  // Backspace starts it over
  before = await restarts(page);
  await page.keyboard.press("Backspace");
  await waitForRestart(page, before);
  expect((await scene(page)).bossHp).toEqual([2000]);

  // Once the Necromancer has hatched some zombies, killing it kills them too.
  // Winning is noted, and the stairs start it over.
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.body.position.set([12, 8]);
  });
  await page.waitForFunction(
    () =>
      (window.DEBUG.game!.entities.getTagged("boss")[0] as any)?.minions
        .length > 0,
    null,
    { timeout: 20000 },
  );
  const afterKill = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    (game.entities.getTagged("boss")[0] as any).die();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      bosses: game.entities.getTagged("boss").length,
      zombies: game.entities.getTagged("zombie").length,
    };
  });
  expect(afterKill).toEqual({ bosses: 0, zombies: 0 });
  await expect(page.locator(".arena-hint")).toContainText("Last: won in");
  expect(
    await page.evaluate(
      () =>
        (window.DEBUG.game!.entities.getTagged("stairwell")[0] as any).barred,
    ),
  ).toBe(false);
  before = await restarts(page);
  await page.keyboard.press("KeyL"); // the level cheat, as if up the stairs
  await waitForRestart(page, before);
  expect((await scene(page)).outcome).toBe("won");

  // Dying starts it over too, with a fresh leader who can still be moved
  await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.inflictDamage(1000);
  });
  await expect(page.locator(".arena-hint")).toContainText("Last: died");
  await page.waitForFunction(
    () =>
      !(
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader.isDestroyed,
    null,
    { timeout: 10000 },
  );
  state = await scene(page);
  expect(state).toMatchObject({ humans: 1, weapons: ["AR-15", "Glock"] });
  const from = await page.evaluate(() => [
    ...(
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader.getPosition(),
  ]);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  const to = await page.evaluate(() => [
    ...(
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader.getPosition(),
  ]);
  expect(to[0]).toBeGreaterThan(from[0] + 0.5);

  // Another boss level from the panel: the Behemoth, whose own button makes
  // it line up a charge
  before = await restarts(page);
  await page.keyboard.press("Tab");
  await page
    .locator(".arena-row", { hasText: "Boss level" })
    .getByRole("button", { name: "behemoth" })
    .click();
  await page.keyboard.press("Tab");
  await waitForRestart(page, before);
  state = await scene(page);
  expect(state).toMatchObject({ floorName: "Penthouse", bossHp: [5000] });
  expect(state.search).toContain("boss=behemoth");
  await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.body.position.set([10, 9]);
  });
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Charge now" }).click();
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      (window.DEBUG.game!.entities.getTagged("boss")[0] as any).controller
        .state !== "chase",
    null,
    { timeout: 5000 },
  );
  await expect(page.locator(".boss-bar__title")).toHaveText("The Behemoth");
  expectNoIssues(issues);
});
