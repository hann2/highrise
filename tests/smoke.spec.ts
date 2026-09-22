import { expect, test } from "@playwright/test";
import {
  collectIssues,
  expectNoIssues,
  getLeaderPosition,
  getLevelNumber,
  loadGame,
  startGame,
} from "./helpers";

// See the "Seeded levels are reproducible" assertion
const LEVEL_2_FINGERPRINT = "315:1038549143";

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

  // --- Pick a character ---
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "CharacterSelect",
      ),
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(500);
  // Two right and one down from the first character is Santa
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "tests/output/character-select.png" });
  expectNoIssues(issues);

  // --- Start a game ---
  await startGame(page);
  const startLevel = await getLevelNumber(page);
  expect(startLevel).toBe(1);
  const leaderName = await page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader.character.name,
  );
  expect(leaderName).toBe("Santa");
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

  // --- Camera keeps up with the player ---
  const cameraOffset = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const [x, y] = leader.getPosition();
    return Math.hypot(game.camera.x - x, game.camera.y - y);
  });
  expect(cameraOffset).toBeLessThan(0.5);

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

  // --- Guns can be picked up and bullets hurt zombies ---
  // Pin the player and a zombie in place so that the shots can't miss
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const pickup = [...game.entities.all].find(
      (e) => e.constructor.name === "WeaponPickup",
    ) as any;
    leader.body.position.set(pickup.getPosition());
  });
  await page.waitForTimeout(300);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(500);
  const targetHp = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const zombie = game.entities
      .getTagged("zombie")
      .find((e) => e.constructor.name === "Zombie") as any;
    const playerPosition = leader.getPosition();
    const pin = () => {
      if (!zombie.isDestroyed && !leader.isDestroyed) {
        leader.hp = leader.maxHp;
        leader.body.position.set(playerPosition);
        leader.body.velocity.set(0, 0);
        zombie.body.position.set(playerPosition.add([2.5, 0]));
        zombie.body.velocity.set(0, 0);
        requestAnimationFrame(pin);
      }
    };
    pin();
    (window as any).testZombie = zombie;
    return zombie.hp as number;
  });
  await page.waitForTimeout(1200); // let the camera settle
  const [targetX, targetY] = await page.evaluate(() => {
    const zombie = (window as any).testZombie;
    const [x, y] = window.DEBUG.game!.camera.toScreen(zombie.getPosition());
    return [x, y];
  });
  await page.mouse.move(targetX, targetY);
  for (let i = 0; i < 3; i++) {
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForTimeout(350);
  }
  const hpAfterShooting = await page.evaluate(
    () => (window as any).testZombie.hp as number,
  );
  expect(hpAfterShooting).toBeLessThan(targetHp);
  // unpin them
  await page.evaluate(() => (window as any).testZombie.die());
  expectNoIssues(issues);

  // --- Doors swing on their hinges and stop at their limits ---
  const doors = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const doors = [...game.entities.all].filter(
      (e) => e.constructor.name === "Door",
    ) as any[];
    const restAngles = doors.map((door) => door.body.angle);
    for (const door of doors) {
      door.body.angularVelocity = 6;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const swings = doors.map((door, i) =>
      Math.abs(door.body.angle - restAngles[i]),
    );
    const hingeDrifts = doors.map((door) =>
      Math.hypot(
        door.body.position[0] - door.hingePoint[0],
        door.body.position[1] - door.hingePoint[1],
      ),
    );
    return {
      count: doors.length,
      swungCount: swings.filter((swing) => swing > 0.3).length,
      maxSwing: Math.max(...swings),
      maxHingeDrift: Math.max(...hingeDrifts),
    };
  });
  expect(doors.count).toBeGreaterThan(0);
  // Some doors only open one way or are blocked, but most should have swung
  expect(doors.swungCount).toBeGreaterThan(doors.count / 2);
  expect(doors.maxSwing).toBeLessThan(2.2);
  expect(doors.maxHingeDrift).toBeLessThan(0.05);

  // --- Pushing a door flings it open ---
  // Stand the player beside a door that is at rest, on the side it opens away from
  const doorMidpoint = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    // A zombie wandering into the doorway would stop the door
    for (const zombie of game.entities.getTagged("zombie")) {
      zombie.destroy();
    }
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const door = [...game.entities.all].find(
      (e) => e.constructor.name === "Door" && (e as any).maxAngle > 1,
    ) as any;
    door.body.angle = door.restingAngle;
    door.body.angularVelocity = 0;
    const angle = door.restingAngle;
    const along = [Math.cos(angle), Math.sin(angle)];
    // Pushing towards +90° from the door turns it towards its max angle
    const pushDirection = [-along[1], along[0]];
    const midpoint = [
      door.hingePoint[0] + along[0] * door.length * 0.6,
      door.hingePoint[1] + along[1] * door.length * 0.6,
    ];
    const standAt = [
      midpoint[0] - pushDirection[0] * 0.6,
      midpoint[1] - pushDirection[1] * 0.6,
    ];
    const pin = () => {
      if (!(window as any).testDoor) return;
      leader.body.position.set(standAt);
      leader.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    (window as any).testDoor = door;
    pin();
    return midpoint;
  });
  await page.waitForTimeout(800); // let the camera settle
  const [doorScreenX, doorScreenY] = await page.evaluate(
    (midpoint) => [...window.DEBUG.game!.camera.toScreen(midpoint as any)],
    doorMidpoint,
  );
  await page.mouse.move(doorScreenX, doorScreenY);
  await page.waitForTimeout(300);
  const doorPush = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const door = (window as any).testDoor;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    door.body.angle = door.restingAngle;
    door.body.angularVelocity = 0;
    leader.push();
    let maxAngularVelocity = 0;
    const start = performance.now();
    while (performance.now() - start < 400) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      maxAngularVelocity = Math.max(
        maxAngularVelocity,
        door.body.angularVelocity,
      );
    }
    (window as any).testDoor = undefined;
    return {
      maxAngularVelocity,
      swing: door.body.angle - door.restingAngle,
    };
  });
  expect(doorPush.maxAngularVelocity).toBeGreaterThan(4);
  expect(doorPush.swing).toBeGreaterThan(1);

  // --- Physics hasn't blown up ---
  const nonFiniteBodies = await page.evaluate(() => {
    let count = 0;
    for (const body of window.DEBUG.game!.world.bodies.all) {
      if (
        !Number.isFinite(body.position[0]) ||
        !Number.isFinite(body.position[1]) ||
        !Number.isFinite(body.angle)
      ) {
        count++;
      }
    }
    return count;
  });
  expect(nonFiniteBodies).toBe(0);

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
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  await page.screenshot({ path: "tests/output/paused.png" });
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);

  // --- Level transitions work (KeyL is a dev cheat) ---
  await page.keyboard.press("KeyL");
  await page.waitForFunction(
    () => {
      const entities = window.DEBUG.game!.entities;
      const levelController = [...entities.all].find(
        (e) => e.constructor.name === "LevelController",
      ) as any;
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

  // Seeded levels are reproducible: everything generated for the level (walls,
  // rooms, decorations, pickups, which enemies where) must be identical every
  // run. If you change level generation on purpose, update the expected value.
  const fingerprint = await page.evaluate(() => {
    const levelController = [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "LevelController",
    ) as any;
    const rows: string[] = levelController.level.entities.map((e: any) => {
      let row = e.constructor.name;
      // Things that move have been ticking since they were generated, so only
      // their order in the list is stable. Everything else is pinned in place.
      if (e.body?.motion !== "dynamic") {
        try {
          const [x, y] = e.getPosition();
          row += ` ${x.toFixed(2)},${y.toFixed(2)}`;
        } catch {}
      }
      return row + ` ${e.decorationInfo?.imageName ?? e.character?.name ?? ""}`;
    });
    let hash = 0;
    for (const c of rows.join("\n")) {
      hash = (hash * 31 + c.charCodeAt(0)) | 0;
    }
    return `${rows.length}:${hash}`;
  });
  expect(fingerprint).toBe(LEVEL_2_FINGERPRINT);

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
