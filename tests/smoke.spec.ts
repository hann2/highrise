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
const LEVEL_2_FINGERPRINT = "335:-827972538";
// What the upgrade screen offers after level 1 with this seed, in order.
// Changes when the upgrade pool, the rarities, or level generation change.
const UPGRADE_OFFER = ["Bloodthirsty", "Night Eyes", "Glass Cannon"];

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
  // Broken save data must not stop the game (it gets replaced at game over)
  await page.addInitScript(() => {
    window.localStorage.setItem("highriseSaveData", "{not json");
  });
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
  // Only the default characters are unlocked in a new save
  await expect(page.locator(".character-select__count")).toHaveText(
    "3 / 13 survivors",
  );
  expect(
    await page.locator(".character-select__portrait--locked").count(),
  ).toBe(10);
  // Two right and one down from the first character is Santa, who is locked
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  await expect(page.locator(".character-select__name")).toHaveText("???");
  await expect(page.locator(".character-select__hint")).toContainText(
    "Rescue them to unlock",
  );
  await page.screenshot({ path: "tests/output/character-select.png" });
  // ...and can't be started
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  expect(
    await page.evaluate(() => ({
      characterSelect: [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "CharacterSelect",
      ),
      humans: window.DEBUG.game!.entities.getTagged("human").length,
    })),
  ).toEqual({ characterSelect: true, humans: 0 });
  // One left of Santa is Nancy, who is unlocked from the start
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(300);
  await expect(page.locator(".character-select__name")).toHaveText("Nancy");
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
  expect(leaderName).toBe("Nancy");
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

  // --- Two weapon slots: a primary gun fills the other slot, and Q swaps ---
  const getSlots = () =>
    page.evaluate(() => {
      const leader = (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader;
      return {
        primary: leader.primary?.stats.name as string | undefined,
        secondary: leader.secondary?.stats.name as string | undefined,
        active: leader.activeSlot as string,
        inHand: leader.weapon?.stats.name as string | undefined,
      };
    });
  // What Santa holds by now depends on what was in reach of the E presses
  // above, so first make sure there's a pistol in the secondary slot
  const pistolName = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    if (leader.secondary?.stats.ammoClass !== "pistol") {
      const pickup = [...game.entities.all].find(
        (e: any) =>
          e.constructor.name === "WeaponPickup" &&
          e.weapon.stats.ammoClass === "pistol",
      ) as any;
      const home = leader.getPosition().clone();
      leader.body.position.set(pickup.getPosition());
      leader.body.velocity.set(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 100));
      leader.interactWithNearest();
      leader.body.position.set(home);
      leader.body.velocity.set(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return leader.secondary?.stats.name as string | undefined;
  });
  expect(pistolName).toBeDefined();
  // A rifle goes in the other slot, leaving the pistol where it is
  await page.keyboard.press("KeyJ"); // dev cheat: an AR-15 at the leader's feet
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  const slots = await getSlots();
  expect(slots.primary).toBe("AR-15");
  expect(slots.secondary).toBe(pistolName);
  expect(slots.inHand).toBe("AR-15");
  await expect(page.locator(".hud-inventory")).toContainText(pistolName!);
  // Q used to throw glowsticks; now it swaps weapons, and glowsticks are gone
  await page.keyboard.press("KeyQ");
  await page.waitForTimeout(350);
  const swapped = await getSlots();
  expect(swapped.active).toBe("secondary");
  expect(swapped.inHand).toBe(pistolName);
  expect(
    await page.evaluate(
      () =>
        [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === "GlowStick",
        ).length,
    ),
  ).toBe(0);
  await expect(page.locator(".hud-reserve")).toHaveText("∞");
  await expect(page.locator(".hud-inventory")).toContainText("AR-15");
  // The mouse wheel swaps too
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(350);
  expect((await getSlots()).inHand).toBe("AR-15");
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(350);
  expect((await getSlots()).inHand).toBe(pistolName);
  await page.keyboard.press("KeyQ");
  await page.waitForTimeout(350);
  expect((await getSlots()).inHand).toBe("AR-15");

  // --- Reloading takes from the reserve, and does nothing when it's empty ---
  const reserveReload = await page.evaluate(async () => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    const gun = leader.weapon;
    const capacity = gun.getCapacity(leader);
    gun.ammo = 0;
    leader.reserve.rifle = capacity + 5;
    leader.reload();
    const start = performance.now();
    while (gun.isReloading && performance.now() - start < 6000) {
      await wait(50);
    }
    const result = {
      capacity,
      reloadedAmmo: gun.ammo,
      reserveLeft: leader.reserve.rifle,
      emptyReloadStarted: false,
      ammoAfterEmptyReload: -1,
    };
    gun.ammo = 0;
    leader.reserve.rifle = 0;
    leader.reload();
    await wait(100);
    result.emptyReloadStarted = gun.isReloading;
    result.ammoAfterEmptyReload = gun.ammo;
    return result;
  });
  expect(reserveReload.reloadedAmmo).toBe(reserveReload.capacity);
  expect(reserveReload.reserveLeft).toBe(5);
  expect(reserveReload.emptyReloadStarted).toBe(false);
  expect(reserveReload.ammoAfterEmptyReload).toBe(0);
  await expect(page.locator(".hud-reload-text")).toHaveText("No Ammo");
  await expect(page.locator(".hud-reserve")).toHaveText("0");
  await page.screenshot({ path: "tests/output/hud-no-ammo.png" });
  await page.keyboard.press("KeyI"); // dev cheat: fill the reserves
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(
      () =>
        (
          [...window.DEBUG.game!.entities.all].find(
            (e) => e.constructor.name === "PartyManager",
          ) as any
        ).leader.weapon.isReloading,
    ),
  ).toBe(true);
  expectNoIssues(issues);

  // --- The push hurts (a little), and a grenade hurts a lot ---
  // A zombie is held just in front of the leader, wherever they face
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const zombie = game.entities
      .getTagged("zombie")
      .find((e) => e.constructor.name === "Zombie") as any;
    const playerPosition = leader.getPosition().clone();
    (window as any).testZombie = zombie;
    (window as any).testZombieDistance = 0.7;
    const pin = () => {
      if (
        zombie.isDestroyed ||
        leader.isDestroyed ||
        !(window as any).testZombie
      )
        return;
      const angle = leader.body.angle;
      const distance = (window as any).testZombieDistance;
      leader.hp = leader.maxHp;
      leader.body.position.set(playerPosition);
      leader.body.velocity.set(0, 0);
      zombie.body.position.set(
        playerPosition.add([
          Math.cos(angle) * distance,
          Math.sin(angle) * distance,
        ]),
      );
      zombie.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    pin();
  });
  await page.waitForTimeout(300);
  const pushed = await page.evaluate(async () => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const zombie = (window as any).testZombie;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const before = zombie.hp;
    leader.push();
    await wait(200);
    const afterOne = zombie.hp;
    // Still cooling down, so this one does nothing
    leader.push();
    await wait(200);
    return { before, afterOne, afterTwo: zombie.hp };
  });
  expect(pushed.before - pushed.afterOne).toBeCloseTo(10);
  expect(pushed.afterTwo).toBe(pushed.afterOne);

  await page.keyboard.press("KeyN"); // dev cheat: frag grenades
  await expect(page.locator(".hud-inventory")).toContainText("Frag Grenade");
  const thrown = await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const zombie = (window as any).testZombie;
    (window as any).testZombieDistance = 2;
    const countBefore = leader.consumableCount;
    leader.useConsumable();
    return { countBefore, countAfter: leader.consumableCount, hp: zombie.hp };
  });
  expect(thrown.countAfter).toBe(thrown.countBefore - 1);
  await page.waitForTimeout(2100); // the fuse is 2 seconds
  await page.screenshot({ path: "tests/output/grenade.png" });
  await page.waitForTimeout(500);
  const blasted = await page.evaluate(() => {
    const zombie = (window as any).testZombie;
    (window as any).testZombie = undefined; // unpin
    return {
      hp: zombie.isDestroyed ? 0 : zombie.hp,
      grenadesLeft: [...window.DEBUG.game!.entities.all].filter(
        (e) => e.constructor.name === "ThrownConsumable",
      ).length,
    };
  });
  expect(blasted.hp).toBeLessThan(thrown.hp - 20);
  expect(blasted.grenadesLeft).toBe(0);
  // All that noise brought zombies over; clear them off so the rest of the
  // test isn't a fight. (Copy the list, because destroying removes from it.)
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    for (const zombie of [...game.entities.getTagged("zombie")] as any[]) {
      if (zombie.getPosition().distanceTo(leader.getPosition()) < 12) {
        zombie.destroy();
      }
    }
    leader.hp = leader.maxHp;
  });

  // --- Ammo boxes in closets restock the reserve ---
  const ammoBox = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const box = [...game.entities.all].find(
      (e) => e.constructor.name === "AmmoPickup",
    ) as any;
    if (!box) {
      return undefined;
    }
    (window as any).testPinAt = box.getPosition();
    const pin = () => {
      const at = (window as any).testPinAt;
      if (!at) return;
      leader.body.position.set(at);
      leader.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    pin();
    leader.reserve[box.ammoClass] = 0;
    const amount = box.amount;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { ammoClass: box.ammoClass as string, amount: amount as number };
  });
  expect(ammoBox).toBeDefined();
  await page.screenshot({ path: "tests/output/ammo-box.png" });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(200);
  const restocked = await page.evaluate((ammoClass) => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    (window as any).testPinAt = undefined;
    return leader.reserve[ammoClass] as number;
  }, ammoBox!.ammoClass);
  expect(restocked).toBe(ammoBox!.amount);
  await page.keyboard.press("KeyI"); // dev cheat: fill the reserves again
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
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const door = [...game.entities.all].find(
      (e: any) =>
        e.constructor.name === "Door" &&
        e.maxAngle > 1 &&
        !e.locked &&
        !e.oneWay,
    ) as any;
    // A zombie wandering into the doorway would stop the door. (Copy the
    // list, because destroying a zombie removes it from the tagged list.)
    for (const zombie of [...game.entities.getTagged("zombie")] as any[]) {
      if (zombie.getPosition().distanceTo(door.hingePoint) < 10) {
        zombie.destroy();
      }
    }
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

  // --- A keycard opens one of the locked rooms ---
  const keycards = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    // Keeps the leader where window.testPinAt says until it's cleared
    const pin = () => {
      const at = (window as any).testPinAt;
      if (!at) return;
      leader.body.position.set(at);
      leader.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    const standAt = async (position: any) => {
      const wasPinned = !!(window as any).testPinAt;
      (window as any).testPinAt = position;
      if (!wasPinned) pin();
      await wait(200);
    };
    /** Tries to swing a door open on whichever side it has room to, and returns how far it went */
    const trySwing = async (door: any) => {
      door.body.angularVelocity = door.maxAngle > 1 ? 6 : -6;
      await wait(300);
      return Math.abs(door.getOpenAngle());
    };

    const keycardPickups = entities.filter(
      (e) => e.constructor.name === "Keycard",
    );
    const locks = entities.filter((e) => e.constructor.name === "KeycardLock");
    (window as any).testLocks = locks;
    const result = {
      keycardCount: keycardPickups.length,
      lockCount: locks.length,
      lockedDoorsStayShut: 0,
      openedWithoutKeycard: false,
      keycardsPickedUp: 0,
      hudShown: false,
      reachableThroughDoor: [] as string[],
    };
    if (keycardPickups.length !== 1 || locks.length !== 2) {
      return result;
    }

    for (const lock of locks) {
      if ((await trySwing(lock.door)) < 0.1) {
        result.lockedDoorsStayShut++;
      }
    }

    // Without a keycard the lock does nothing
    await standAt(locks[0].outsidePosition);
    leader.interactWithNearest();
    await wait(100);
    result.openedWithoutKeycard = !locks[0].door.locked;

    await standAt(keycardPickups[0].getPosition());
    leader.interactWithNearest();
    await wait(100);
    result.keycardsPickedUp = leader.keycards;
    result.hudShown = !!document.querySelector(".hud-keycards");

    // Right outside the locked door, the lock is usable but the closet's
    // contents behind the door are not, even though they're within range
    const doorway = locks[0].door.getDoorwayCenter();
    await standAt(doorway.lerp(locks[0].outsidePosition, 0.6));
    result.reachableThroughDoor = leader
      .getNearbyInteractables()
      .map((i: any) => i.parent?.constructor.name);

    // Stays pinned here for the screenshot, then uses the lock from here
    await standAt(doorway.lerp(locks[0].outsidePosition, 1.6));
    return result;
  });
  expect(keycards.reachableThroughDoor).toContain("KeycardLock");
  expect(keycards.reachableThroughDoor).not.toContain("WeaponPickup");
  expect(keycards.reachableThroughDoor).not.toContain("HealthPickup");
  expect(keycards.reachableThroughDoor).not.toContain("AmmoPickup");
  expect(keycards.reachableThroughDoor).not.toContain("ConsumablePickup");
  expect(keycards.keycardCount).toBe(1);
  expect(keycards.lockCount).toBe(2);
  expect(keycards.lockedDoorsStayShut).toBe(2);
  expect(keycards.openedWithoutKeycard).toBe(false);
  expect(keycards.keycardsPickedUp).toBe(1);
  expect(keycards.hudShown).toBe(true);
  await page.waitForTimeout(800); // let the camera settle
  await page.screenshot({ path: "tests/output/level-1-locked-door.png" });

  const unlocking = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const locks = (window as any).testLocks;
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    leader.interactWithNearest();
    await wait(100);
    const door = locks[0].door;
    const result = {
      unlocked: !door.locked,
      keycardsLeft: leader.keycards,
      lockRemoved: locks[0].isDestroyed,
      unlockedSwing: 0,
      otherStillLocked: locks[1].door.locked,
    };
    door.body.angularVelocity = door.maxAngle > 1 ? 6 : -6;
    await wait(300);
    result.unlockedSwing = Math.abs(door.getOpenAngle());
    (window as any).testPinAt = undefined;
    return result;
  });
  expect(unlocking.unlocked).toBe(true);
  expect(unlocking.keycardsLeft).toBe(0);
  expect(unlocking.lockRemoved).toBe(true);
  expect(unlocking.unlockedSwing).toBeGreaterThan(0.3);
  expect(unlocking.otherStillLocked).toBe(true);
  expectNoIssues(issues);

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

  // --- Quarters drop and get picked up by walking over them ---
  // In front of a vending machine, because that is known to be open floor
  const quarterDrop = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const find = (name: string) =>
      [...game.entities.all].find((e) => e.constructor.name === name) as any;
    const partyManager = find("PartyManager");
    const leader = partyManager.leader;
    const machine = find("VendingMachine");
    const before = partyManager.quarters;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // Zombies around the machine would interrupt the shopping
    for (const zombie of [...game.entities.getTagged("zombie")] as any[]) {
      if (zombie.getPosition().distanceTo(machine.getFrontPosition()) < 10) {
        zombie.destroy();
      }
    }
    leader.body.position.set(machine.getFrontPosition(1.8));
    leader.body.velocity.set(0, 0);
    await wait(100);
    const quarter = find("QuarterDropper").dropQuarter(
      machine.getFrontPosition(0.6),
    );
    await wait(300);
    const whileAway = partyManager.quarters;
    leader.body.position.set(machine.getFrontPosition(1.0));
    leader.body.velocity.set(0, 0);
    await wait(300);
    return {
      before,
      whileAway,
      after: partyManager.quarters,
      quarterGone: quarter.isDestroyed,
    };
  });
  expect(quarterDrop.whileAway).toBe(quarterDrop.before);
  expect(quarterDrop.after).toBe(quarterDrop.before + 1);
  expect(quarterDrop.quarterGone).toBe(true);
  await expect(page.locator(".hud-quarters")).toHaveText(
    String(quarterDrop.after),
  );

  // --- Vending machines sell health for quarters ---
  await page.keyboard.press("KeyK"); // dev cheat: +5 quarters
  const machineFront = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const find = (name: string) =>
      [...game.entities.all].find((e) => e.constructor.name === name) as any;
    const leader = find("PartyManager").leader;
    const machine = find("VendingMachine");
    const standAt = machine.getFrontPosition(1.0);
    const pin = () => {
      if (!(window as any).testMachine) return;
      // Zombies wander over while we stand here, and the leader dying ends the run
      leader.hp = leader.maxHp;
      leader.body.position.set(standAt);
      leader.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    (window as any).testMachine = machine;
    pin();
    return [...machine.getFrontPosition()];
  });
  await page.waitForTimeout(800); // let the camera settle
  const countHealthPickups = () =>
    page.evaluate(
      () =>
        [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === "HealthPickup",
        ).length,
    );
  const getQuarters = () =>
    page.evaluate(
      () =>
        (
          [...window.DEBUG.game!.entities.all].find(
            (e) => e.constructor.name === "PartyManager",
          ) as any
        ).quarters as number,
    );
  const quartersBeforeBuying = await getQuarters();
  expect(quartersBeforeBuying).toBe(quarterDrop.after + 5);
  const healthPickupsBefore = await countHealthPickups();
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1000);
  expect(await getQuarters()).toBe(quartersBeforeBuying - 3);
  expect(await countHealthPickups()).toBe(healthPickupsBefore + 1);
  const dispensedDistance = await page.evaluate((front) => {
    const pickups = [...window.DEBUG.game!.entities.all].filter(
      (e) => e.constructor.name === "HealthPickup",
    ) as any[];
    return Math.min(
      ...pickups.map((p) =>
        Math.hypot(
          p.sprite.position.x - front[0],
          p.sprite.position.y - front[1],
        ),
      ),
    );
  }, machineFront);
  expect(dispensedDistance).toBeLessThan(0.01);
  await page.screenshot({ path: "tests/output/vending-machine.png" });

  // Without enough quarters it doesn't dispense
  const brokeBuy = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const partyManager = [...game.entities.all].find(
      (e) => e.constructor.name === "PartyManager",
    ) as any;
    const machine = (window as any).testMachine;
    const quarters = partyManager.quarters;
    partyManager.quarters = 2;
    machine.buy();
    await new Promise((resolve) => setTimeout(resolve, 800));
    const quartersAfter = partyManager.quarters;
    partyManager.quarters = quarters;
    return quartersAfter;
  });
  expect(brokeBuy).toBe(2);
  expect(await countHealthPickups()).toBe(healthPickupsBefore + 1);

  // Breaking a machine spills some quarters, once
  const spilled = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const machine = (window as any).testMachine;
    (window as any).testMachine = undefined; // unpin, so nobody collects them
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.body.position.set(machine.getFrontPosition(4));
    const countQuarters = () =>
      [...game.entities.all].filter((e) => e.constructor.name === "Quarter")
        .length;
    const before = countQuarters();
    machine.die();
    machine.die();
    await new Promise((resolve) => setTimeout(resolve, 600));
    return countQuarters() - before;
  });
  await page.screenshot({ path: "tests/output/broken-vending-machine.png" });
  expect(spilled).toBeGreaterThanOrEqual(2);
  expect(spilled).toBeLessThanOrEqual(4);
  expectNoIssues(issues);

  // --- The exit stairwell's door only opens inwards, and locks behind the
  // leader. The floor's survivor joins and follows the leader in. ---
  const stairwell = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    let pinnedAt: any = undefined;
    const pin = () => {
      if (!pinnedAt) return;
      leader.body.position.set(pinnedAt);
      leader.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    const standAt = async (position: any) => {
      const wasPinned = !!pinnedAt;
      pinnedAt = position;
      if (!wasPinned) pin();
      await wait(200);
    };
    /** Swings the door towards `direction` (1 = the way it opens) and returns how far it went that way */
    const trySwing = async (door: any, direction: number) => {
      door.body.angle = door.restingAngle;
      door.body.angularVelocity = 6 * direction * door.oneWay;
      await wait(300);
      return door.getOpenAngle() * direction * door.oneWay;
    };

    const stairwells = entities.filter(
      (e) => e.constructor.name === "Stairwell",
    );
    const survivorControllers = entities.filter(
      (e) => e.constructor.name === "SurvivorHumanController",
    );
    const partyManager = entities.find(
      (e) => e.constructor.name === "PartyManager",
    );
    const exits = entities.filter((e) => e.constructor.name === "Exit");
    const stairwell = stairwells[0];
    const door = stairwell?.door;
    const result = {
      stairwellCount: stairwells.length,
      exitCount: exits.length,
      exitInside: false,
      hasOneWayDoor: false,
      lockedWhenPartyAway: false,
      unlockedForParty: false,
      outwardSwing: 1,
      inwardSwing: 0,
      sealed: false,
      lockedAfterEntering: false,
      sealedSwing: 1,
      levelBefore: 0,
      levelAfter: 0,
      survivorCount: survivorControllers.length,
      survivorJoined: false,
      allyInsideWhenSealed: false,
      allyName: "",
    };
    if (!door || exits.length !== 1) {
      return result;
    }
    const levelController = entities.find(
      (e) => e.constructor.name === "LevelController",
    );
    result.levelBefore = levelController.currentLevel;
    result.exitInside = stairwell.contains(exits[0].getPosition());
    result.hasOneWayDoor = door.oneWay === 1 || door.oneWay === -1;
    result.lockedWhenPartyAway = door.locked;

    // Which way is in? The doorway is on the edge of the stairwell's box.
    const doorway = door.getDoorwayCenter();
    const { min, max } = stairwell;
    const inward =
      Math.abs(doorway[0] - min[0]) < 0.01
        ? [1, 0]
        : Math.abs(doorway[0] - max[0]) < 0.01
          ? [-1, 0]
          : Math.abs(doorway[1] - min[1]) < 0.01
            ? [0, 1]
            : [0, -1];

    // Party members in the hallway can open it, but only inwards
    await standAt(doorway.add(inward.map((x) => x * -1.2)));
    result.unlockedForParty = !door.locked;
    result.outwardSwing = await trySwing(door, -1);
    result.inwardSwing = await trySwing(door, 1);

    // The floor's survivor, put between the leader and the door, joins the
    // party (they need to be close and in sight of the leader)
    const survivor = survivorControllers[0]?.human;
    if (survivor) {
      result.allyName = survivor.character.name;
      survivor.body.position.set(doorway.add(inward.map((x) => x * -0.5)));
      survivor.body.velocity.set(0, 0);
      await wait(300);
      result.survivorJoined =
        partyManager.partyMembers.includes(survivor) &&
        survivorControllers[0].isDestroyed;
    }

    // Stand inside, away from the doorway and off the stairs
    const exitPosition = exits[0].getPosition();
    const cellCenters = [
      [min[0] + 1, min[1] + 1],
      [max[0] - 1, min[1] + 1],
      [min[0] + 1, max[1] - 1],
      [max[0] - 1, max[1] - 1],
    ]
      .map(([x, y]) => exitPosition.clone().set(x, y))
      .filter((p) => p.distanceTo(exitPosition) > 0.5)
      .sort((a, b) => b.distanceTo(doorway) - a.distanceTo(doorway));
    await standAt(cellCenters[0]);
    // The ally right behind the leader follows them in before it seals
    const sealStart = performance.now();
    while (!stairwell.sealed && performance.now() - sealStart < 7000) {
      await wait(100);
    }
    await wait(300);
    result.sealed = stairwell.sealed;
    result.allyInsideWhenSealed =
      !!survivor &&
      !survivor.isDestroyed &&
      stairwell.contains(survivor.getPosition());
    result.lockedAfterEntering = door.locked;
    result.sealedSwing = Math.max(
      Math.abs(await trySwing(door, 1)),
      Math.abs(await trySwing(door, -1)),
    );
    result.levelAfter = levelController.currentLevel;

    pinnedAt = undefined;
    return result;
  });
  expect(stairwell.stairwellCount).toBe(1);
  expect(stairwell.survivorCount).toBe(1);
  expect(stairwell.survivorJoined).toBe(true);
  expect(stairwell.allyInsideWhenSealed).toBe(true);
  expect(stairwell.exitCount).toBe(1);
  expect(stairwell.exitInside).toBe(true);
  expect(stairwell.hasOneWayDoor).toBe(true);
  expect(stairwell.lockedWhenPartyAway).toBe(true);
  expect(stairwell.unlockedForParty).toBe(true);
  expect(stairwell.outwardSwing).toBeLessThan(0.1);
  expect(stairwell.inwardSwing).toBeGreaterThan(0.5);
  expect(stairwell.sealed).toBe(true);
  expect(stairwell.lockedAfterEntering).toBe(true);
  expect(stairwell.sealedSwing).toBeLessThan(0.1);
  // Standing in the stairwell doesn't finish the level; the stairs do
  expect(stairwell.levelAfter).toBe(stairwell.levelBefore);
  await page.screenshot({ path: "tests/output/level-1-stairwell.png" });
  expectNoIssues(issues);

  // --- Pausing stops the clock ---
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);

  // --- The encyclopedia opens over the pause menu and shows what was found ---
  const heldGun = await page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader.weapon.stats.name as string,
  );
  await page.locator(".menu-button", { hasText: "Encyclopedia" }).waitFor();
  await page.locator(".menu-button", { hasText: "Encyclopedia" }).click();
  await expect(page.locator(".encyclopedia")).toBeVisible();
  await expect(page.locator(".pause-menu__background")).toHaveCount(0);
  const selectedTab = page.locator(".encyclopedia__tab--selected");
  await expect(selectedTab).toContainText("Characters");
  // Right goes to the guns: the one picked up is revealed, the rest aren't
  await page.keyboard.press("ArrowRight");
  await expect(selectedTab).toContainText("Guns");
  await expect(selectedTab).toContainText(/[1-9]\d* \/ 11/);
  const gunEntries = page.locator(".encyclopedia__entry");
  await expect(gunEntries).toHaveCount(11);
  await expect(
    page.locator(".encyclopedia__entry", { hasText: heldGun }),
  ).toHaveCount(1);
  expect(
    await page.locator(".encyclopedia__entry--unknown").count(),
  ).toBeGreaterThan(0);
  await expect(
    page.locator(".encyclopedia__entry--unknown").first(),
  ).toHaveText("???");
  // Down walks the list; the detail panel follows the selection
  const gunNames = await gunEntries.allInnerTexts();
  const heldIndex = gunNames.findIndex((name) => name.trim() === heldGun);
  await page.mouse.move(1, 1); // so hovering doesn't move the selection
  for (let i = 0; i < heldIndex; i++) {
    await page.keyboard.press("ArrowDown");
  }
  const detail = page.locator(".encyclopedia__detail");
  await expect(detail).toContainText(heldGun);
  await expect(detail).toContainText("Magazine");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "tests/output/encyclopedia.png" });
  const unknownIndex = gunNames.findIndex((name) => name.trim() === "???");
  for (let i = heldIndex; i < unknownIndex; i++) {
    await page.keyboard.press("ArrowDown");
  }
  for (let i = unknownIndex; i > heldIndex; i--) {
    await page.keyboard.press("ArrowUp");
  }
  await expect(detail).toContainText(heldGun);
  // Unfound entries show no name or stats
  await page.locator(".encyclopedia__entry--unknown").first().click();
  await expect(page.locator(".encyclopedia__detail-name")).toHaveText("???");
  expect(await detail.innerText()).not.toContain("Magazine");
  // Guns → Melee → Upgrades → Enemies, where the zombie shot earlier is known
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(selectedTab).toContainText("Enemies");
  await expect(
    page.locator(".encyclopedia__entry:not(.encyclopedia__entry--unknown)", {
      hasText: "Zombie",
    }),
  ).toHaveCount(1);
  // Escape closes it without unpausing, and the pause menu comes back
  await page.keyboard.press("Escape");
  await expect(page.locator(".encyclopedia")).toHaveCount(0);
  await expect(page.locator(".pause-menu__background")).toHaveCount(1);
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  const seen = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem("highriseSaveData")!).seen,
  );
  expect(seen.guns).toContain(heldGun);
  expect(seen.enemies).toContain("Zombie");
  expectNoIssues(issues);

  await page.screenshot({ path: "tests/output/paused.png" });
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);

  // --- Hiding the tab pauses until it's back, unless auto-pause is off ---
  const hidingPauses = () =>
    page.evaluate(() => {
      const game = window.DEBUG.game!;
      const setHidden = (hidden: boolean) => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => hidden,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      };
      setHidden(true);
      const paused = game.paused;
      setHidden(false);
      const resumed = !game.paused;
      delete (document as { hidden?: boolean }).hidden;
      return paused && resumed;
    });
  expect(await hidingPauses()).toBe(true);
  await page.keyboard.press("Escape");
  await page.locator(".menu-button", { hasText: "Auto-Pause: On" }).click();
  await expect(
    page.locator(".menu-button", { hasText: "Auto-Pause: Off" }),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  expect(await hidingPauses()).toBe(false);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(window.localStorage.getItem("highriseSaveData")!).autoPause,
    ),
  ).toBe(false);

  // --- Level transitions work (KeyL is a dev cheat) ---
  const statsBefore = await page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader.stats,
  );
  await page.keyboard.press("KeyL");

  // --- Between floors the leader picks one of three upgrades ---
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "UpgradeSelect",
      ),
    null,
    { timeout: 15000 },
  );
  const offer = await page.evaluate(() => {
    const screen = [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "UpgradeSelect",
    ) as any;
    return {
      names: screen.choices.map((u: any) => u.name) as string[],
      paused: window.DEBUG.game!.paused,
      cards: document.querySelectorAll(".upgrade-select__card").length,
      pauseMenuShown: !!document.querySelector(".pause-menu__background"),
    };
  });
  // Seeded, and drawn after the level is generated, so always the same offer
  expect(offer.names).toEqual(UPGRADE_OFFER);
  expect(offer.paused).toBe(true);
  expect(offer.cards).toBe(3);
  expect(offer.pauseMenuShown).toBe(false);

  // --- The ally in the stairwell made it out, and is unlocked for good ---
  await expect(page.locator(".survivor-toast")).toContainText(
    `${stairwell.allyName} made it out!`,
  );
  const unlockedAfterFloor1 = await page.evaluate(
    () =>
      JSON.parse(window.localStorage.getItem("highriseSaveData")!)
        .unlockedCharacters as string[],
  );
  expect(unlockedAfterFloor1).toEqual([
    "Andy",
    "Chad",
    "Nancy",
    stairwell.allyName,
  ]);
  // Escape doesn't unpause behind the upgrade screen's back
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: "tests/output/upgrade-select.png" });
  // Take Glass Cannon with the keyboard
  const pick = offer.names.indexOf("Glass Cannon");
  // The card under the mouse is selected when the screen appears, so get the
  // mouse out of the way and step from wherever the selection is
  await page.mouse.move(1, 1);
  const selected = await page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "UpgradeSelect",
        ) as any
      ).selected as number,
  );
  for (let i = 0; i < (pick - selected + 3) % 3; i++) {
    await page.keyboard.press("ArrowRight");
  }
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !window.DEBUG.game!.paused, null, {
    timeout: 5000,
  });
  expectNoIssues(issues);

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

  // --- Survivors only come along for one floor ---
  const floor2Party = await page.evaluate(() => {
    const partyManager = [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "PartyManager",
    ) as any;
    return {
      size: partyManager.partyMembers.length,
      leader: partyManager.leader.character.name,
      humans: window.DEBUG.game!.entities.getTagged("human").map(
        (h: any) => h.character.name,
      ),
    };
  });
  expect(floor2Party.size).toBe(1);
  expect(floor2Party.leader).toBe("Nancy");
  expect(floor2Party.humans).not.toContain(stairwell.allyName);

  // --- The upgrade stuck: the leader hits harder, and has less health ---
  const upgraded = await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    return {
      stats: leader.stats,
      upgrades: leader.upgrades.map((u: any) => u.name),
      maxHp: leader.maxHp,
      hp: leader.hp,
    };
  });
  expect(upgraded.upgrades).toEqual(["Glass Cannon"]);
  expect(upgraded.stats.damage).toBeCloseTo(statsBefore.damage * 1.5);
  expect(upgraded.maxHp).toBe(statsBefore.maxHp - 30);
  expect(upgraded.hp).toBeLessThanOrEqual(upgraded.maxHp);
  // Nothing else changed
  expect({
    ...upgraded.stats,
    damage: statsBefore.damage,
    maxHp: statsBefore.maxHp,
  }).toEqual(statsBefore);

  // --- Stats are read at use time: bigger magazine, instant reload, and
  // vision and flashlight ranges that rebuild their textures ---
  const reloaded = await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.stats.visionRange = 1.3;
    leader.stats.flashlightRange = 1.5;
    const gun = leader.weapon;
    if (gun?.constructor.name !== "Gun") {
      return undefined;
    }
    leader.stats.magazineSize = 1.5;
    leader.stats.instantEmptyReload = true;
    gun.ammo = 0;
    leader.reload();
    return { ammo: gun.ammo, baseCapacity: gun.stats.ammoCapacity };
  });
  expect(reloaded).toBeDefined();
  expect(reloaded!.ammo).toBe(Math.round(reloaded!.baseCapacity * 1.5));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "tests/output/level-2-upgraded.png" });
  expectNoIssues(issues);

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

  // --- The leader dying ends the run, even with an ally alive ---
  // This floor's survivor joins (tried on each side of the leader until one
  // is in sight), then a zombie finishes off the leader
  const death = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const partyManager = entities.find(
      (e) => e.constructor.name === "PartyManager",
    );
    const leader = partyManager.leader;
    const survivorController = entities.find(
      (e) => e.constructor.name === "SurvivorHumanController",
    );
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    const result = {
      allyJoined: false,
      allyName: "",
      leaderDead: false,
      allyAliveWhenLeaderDied: false,
    };
    const ally = survivorController?.human;
    if (!ally) {
      return result;
    }
    result.allyName = ally.character.name;
    for (let i = 0; i < 8 && !partyManager.hasMember(ally); i++) {
      const angle = (i * Math.PI) / 4;
      ally.body.position.set(
        leader.getPosition().add([Math.cos(angle), Math.sin(angle)]),
      );
      ally.body.velocity.set(0, 0);
      await wait(150);
    }
    result.allyJoined = partyManager.hasMember(ally);

    // (The ally may well shoot it, so there's always another one lined up)
    const findZombie = () =>
      game.entities
        .getTagged("zombie")
        .find((e) => e.constructor.name === "Zombie") as any;
    let zombie = findZombie();
    leader.hp = 1;
    const pin = () => {
      if (leader.isDestroyed) return;
      if (zombie.isDestroyed) zombie = findZombie();
      zombie.body.position.set(leader.getPosition().add([0.8, 0]));
      zombie.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    pin();
    const start = performance.now();
    while (!leader.isDestroyed && performance.now() - start < 10000) {
      await wait(100);
    }
    result.leaderDead = leader.isDestroyed;
    result.allyAliveWhenLeaderDied = !ally.isDestroyed;
    return result;
  });
  expect(death.allyJoined).toBe(true);
  expect(death.leaderDead).toBe(true);
  expect(death.allyAliveWhenLeaderDied).toBe(true);
  await page.waitForFunction(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "GameOverScreen",
        ) as any
      )?.ready,
    null,
    { timeout: 15000 },
  );
  const summaryText = await page.locator(".run-summary").innerText();
  expect(summaryText).toContain("You Died");
  expect(summaryText).toContain("Floor reached");
  expect(summaryText).toContain("Nancy");
  // The survivor who made it out of floor 1 is called out; the one who was
  // with the leader when they died isn't
  expect(summaryText).toContain(`Unlocked ${stairwell.allyName}!`);
  expect(summaryText).not.toContain(`Unlocked ${death.allyName}!`);
  await page.screenshot({ path: "tests/output/run-summary.png" });
  const saved = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("highriseSaveData")!),
  );
  expect(saved.version).toBe(1);
  expect(saved.runs.length).toBe(1);
  const run = saved.runs[0];
  expect(run.outcome).toBe("died");
  // Whatever got there first (a shot zombie can come back as a crawler), but
  // known: the cause is taken before the run summary is
  expect(["Zombie", "Crawler"]).toContain(run.causeOfDeath);
  expect(run.charactersUnlocked).toEqual([stairwell.allyName]);
  expect(saved.unlockedCharacters).not.toContain(death.allyName);
  expect(run.character).toBe("Nancy");
  expect(run.floorReached).toBe(2);
  expect(saved.bestFloor).toBe(2);
  expect(run.kills.Zombie).toBeGreaterThan(0);
  expect(run.quartersSpent).toBe(3);
  expect(run.quartersCollected).toBeGreaterThanOrEqual(6);
  expect(run.timeSeconds).toBeGreaterThan(5);
  // Offered upgrades count as seen, and saving the run kept the seen flags
  expect(saved.seen.upgrades).toEqual(expect.arrayContaining(UPGRADE_OFFER));
  expect(saved.seen.guns.length).toBeGreaterThan(0);
  // The game is cleared away behind the summary
  expect(
    await page.evaluate(
      () => window.DEBUG.game!.entities.getTagged("human").length,
    ),
  ).toBe(0);

  // The encyclopedia opens from the summary too, and Escape closes it
  // without also leaving the summary
  await page.keyboard.press("KeyE");
  await expect(page.locator(".encyclopedia")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".encyclopedia")).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(
    await page.evaluate(() =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "GameOverScreen",
      ),
    ),
  ).toBe(true);

  // Continuing goes back to the main menu
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "MainMenu",
      ),
    null,
    { timeout: 15000 },
  );

  // --- The main menu opens the encyclopedia too, and comes back after ---
  await page.keyboard.press("KeyE");
  await expect(page.locator(".encyclopedia")).toBeVisible();
  await expect(page.locator(".menu-title")).toHaveCount(0);
  await page.locator(".menu-button", { hasText: "Back" }).click();
  await expect(page.locator(".encyclopedia")).toHaveCount(0);
  await expect(page.locator(".menu-title")).toHaveCount(1);
  expectNoIssues(issues);
});
