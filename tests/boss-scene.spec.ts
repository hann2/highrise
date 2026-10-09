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

/** Waits until the fight has started over (the boss is back at full health and the leader's fresh) */
async function waitForRestart(page: Page, bossHp: number) {
  await page.waitForFunction(
    (bossHp) => {
      const game = window.DEBUG.game!;
      const bosses = game.entities.getTagged("boss") as any[];
      return (
        bosses.length === 1 &&
        Math.abs(bosses[0].hp - bossHp) < 1 &&
        game.entities.getTagged("boss_fight").length === 1
      );
    },
    bossHp,
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
  await waitForRestart(page, 2300);

  // The loadout, on the first boss floor (act 2: the Necromancer's 2000 HP
  // is 2300), with the URL filled in
  let state = await scene(page);
  expect(state).toMatchObject({
    floor: 5,
    floorName: "Chapel",
    character: "Chad",
    weapons: ["AR-15", "Glock"],
    items: ["Night Vision"],
    quarters: 30,
    bossHp: [2300],
    fights: 1,
    humans: 1,
    runStats: false,
    pauseMenu: false,
  });
  expect(state.search).toContain("floor=5");
  await page.screenshot({ path: "tests/output/boss-scene.png" });

  // The setup panel: the same boss on floor 10 is in act 3, and applying
  // starts it over there and rewrites the URL
  await page.keyboard.press("Tab");
  await expect(page.locator(".arena-panel")).toHaveCount(1);
  await page.screenshot({ path: "tests/output/boss-scene-panel.png" });
  await page
    .locator(".arena-row", { hasText: "Floor" })
    .getByRole("button", { name: "10", exact: true })
    .click();
  await page.keyboard.press("Tab");
  await expect(page.locator(".arena-panel")).toHaveCount(0);
  await waitForRestart(page, 2600);
  state = await scene(page);
  expect(state).toMatchObject({
    floor: 10,
    floorName: "Chapel",
    weapons: ["AR-15", "Glock"],
    bossHp: [2600],
    humans: 1,
  });
  expect(state.search).toContain("floor=10");

  // The boss's health can be set in the middle of the fight
  await page.keyboard.press("Tab");
  await page
    .locator(".arena-row", { hasText: "Boss health" })
    .getByRole("button", { name: "Half" })
    .click();
  await page.keyboard.press("Escape");
  expect((await scene(page)).bossHp).toEqual([1300]);

  // Backspace starts it over
  await page.keyboard.press("Backspace");
  await waitForRestart(page, 2600);

  // Winning (Shift+L kills every enemy) is noted, and the stairs start it over
  await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.body.position.set([12, 8]);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  });
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.press("KeyL");
  await page.keyboard.up("ShiftLeft");
  await expect(page.locator(".arena-hint")).toContainText("Last: won in");
  expect(
    await page.evaluate(
      () =>
        (window.DEBUG.game!.entities.getTagged("stairwell")[0] as any).barred,
    ),
  ).toBe(false);
  await page.keyboard.press("KeyL"); // the level cheat, as if up the stairs
  await waitForRestart(page, 2600);
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
  const before = await page.evaluate(() => [
    ...(
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader.getPosition(),
  ]);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  const after = await page.evaluate(() => [
    ...(
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader.getPosition(),
  ]);
  expect(after[0]).toBeGreaterThan(before[0] + 0.5);
  expectNoIssues(issues);
});
