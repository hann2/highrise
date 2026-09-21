import { expect, test } from "@playwright/test";
import {
  collectIssues,
  expectNoIssues,
  getLeaderPosition,
  getLevelNumber,
  loadGame,
  startGame,
} from "./helpers";

/**
 * E2E tests are slow because of browser startup and asset preloading, so we
 * prefer one long test that makes lots of assertions along the way over lots
 * of small isolated tests.
 */
test("game boots, plays, and changes levels without errors", async ({
  page,
}) => {
  const issues = collectIssues(page);
  const game = () => page.evaluate(() => window.DEBUG.game!.ticknumber);

  // --- Boot to main menu ---
  await loadGame(page, 12345);
  expect(await game()).toBeGreaterThan(0);
  expectNoIssues(issues);

  // --- Start a game ---
  await startGame(page);
  const startLevel = await getLevelNumber(page);
  expect(startLevel).toBe(1);
  // let the fade in finish and lighting settle
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "tests/output/level-1-start.png" });
  expectNoIssues(issues);

  // --- Player can move ---
  const before = await getLeaderPosition(page);
  for (const key of ["KeyD", "KeyS", "KeyA", "KeyW"]) {
    await page.keyboard.down(key);
    await page.waitForTimeout(400);
    await page.keyboard.up(key);
  }
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(600);
  const during = await getLeaderPosition(page);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyS");
  // We might have been up against a wall in one direction, but not all of them
  const moved = Math.hypot(during[0] - before[0], during[1] - before[1]) > 0.05;
  expect(moved).toBe(true);

  // --- Player can attack and interact without anything blowing up ---
  await page.mouse.move(900, 300);
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
  await page.keyboard.press("KeyR");
  await page.keyboard.press("KeyE");
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/output/level-1-action.png" });
  expectNoIssues(issues);

  // --- Zombies can die ---
  // (Not checking the zombie count, because dead zombies sometimes become crawlers)
  const zombieDestroyed = await page.evaluate(() => {
    const zombie = window.DEBUG.game!.entities.getTagged("zombie")[0] as any;
    zombie.die();
    return zombie.isDestroyed;
  });
  expect(zombieDestroyed).toBe(true);
  await page.waitForTimeout(500);
  expectNoIssues(issues);

  // --- Pausing stops the clock ---
  await page.keyboard.press("KeyP");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  await page.screenshot({ path: "tests/output/paused.png" });
  await page.keyboard.press("KeyP");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);

  // --- Level transitions work (KeyL is a dev cheat) ---
  await page.keyboard.press("KeyL");
  await page.waitForFunction(
    () => {
      const entities = window.DEBUG.game!.entities;
      const levelController = entities.getById("level_controller") as any;
      return (
        levelController.currentLevel === 2 &&
        entities.getTagged("zombie").length > 0
      );
    },
    null,
    { timeout: 15000 },
  );
  expect(
    await page.evaluate(
      () => window.DEBUG.game!.entities.getTagged("human").length,
    ),
  ).toBeGreaterThan(0);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "tests/output/level-2-start.png" });

  // Seeded levels should be reproducible. Not asserted on because any change
  // to level generation legitimately changes it, but handy when comparing runs.
  const fingerprint = await page.evaluate(() => {
    let sum = 0;
    for (const body of window.DEBUG.game!.world.bodies as any[]) {
      // Only walls, because decoration placement isn't fully reproducible yet
      if (body.owner?.constructor?.name === "Wall") {
        for (const shape of body.shapes) {
          sum += (body.position[0] + shape.position[0]) * 3;
          sum += (body.position[1] + shape.position[1]) * 7;
        }
      }
    }
    return Math.round(sum);
  });
  console.log(`level 2 fingerprint: ${fingerprint}`);

  // --- Zoomed out overview with the vision mask off (KeyV is a dev cheat) ---
  // Mostly useful as a visual reference for level generation and lighting.
  await page.keyboard.press("KeyV");
  await page.evaluate(() => (window.DEBUG.game!.camera.z = 14));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "tests/output/level-2-overview.png" });
  await page.keyboard.press("KeyV");
  await page.evaluate(() => (window.DEBUG.game!.camera.z = 65));

  // --- Let it run for a bit to catch slow-burn errors ---
  const tickBefore = await game();
  await page.waitForTimeout(3000);
  expect(await game()).toBeGreaterThan(tickBefore + 60);
  expectNoIssues(issues);
});
