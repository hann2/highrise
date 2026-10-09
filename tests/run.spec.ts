import { expect, Page, test } from "@playwright/test";
import { collectIssues, expectNoIssues, loadGame, startGame } from "./helpers";

/** Presses the level-complete cheat until the run is on `floor` and it has enemies (or it's a boss level) */
async function goToFloor(page: Page, floor: number) {
  const currentLevel = () =>
    page.evaluate(
      () =>
        (window.DEBUG.game!.entities.getTagged("level_controller")[0] as any)
          .currentLevel as number,
    );
  while ((await currentLevel()) < floor) {
    const from = await currentLevel();
    await page.keyboard.press("KeyL"); // dev cheat: finish the level
    await page.waitForFunction(
      (from) => {
        const entities = window.DEBUG.game!.entities;
        const levelController = entities.getTagged(
          "level_controller",
        )[0] as any;
        return (
          levelController.currentLevel > from &&
          !levelController.changingLevel &&
          (entities.getTagged("zombie").length > 0 ||
            entities.getTagged("boss_fight").length > 0)
        );
      },
      from,
      { timeout: 20000 },
    );
  }
  await page.waitForTimeout(500);
}

/**
 * Up through a run with the level cheat, to the floors whose shape comes from
 * the run plan (`run/acts.ts`): act 1's keycard floor, the first boss level
 * (5), and the big store after it (6). The lobby and the first two floors are
 * in the smoke test.
 */
test("the run's keycard floor, boss and big store", async ({ page }) => {
  const issues = collectIssues(page);
  await loadGame(page, 12345);
  await startGame(page);

  // --- Act 1's keycard floor, with an armory and an infirmary ---
  const keycardFloor = await page.evaluate(
    () =>
      (
        window.DEBUG.game!.entities.getTagged("level_controller")[0] as any
      ).plan.find((floor: any) => floor.act === 1 && floor.keycard)
        .number as number,
  );
  expect(keycardFloor).toBeLessThan(5);
  await goToFloor(page, keycardFloor);
  // Nothing in the way of the doors swinging (Shift+L kills every enemy)
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.press("KeyL");
  await page.keyboard.up("ShiftLeft");
  const lockedRooms = await page.evaluate(() => {
    const entities = [...window.DEBUG.game!.entities.all] as any[];
    const levelController = entities.find(
      (e) => e.constructor.name === "LevelController",
    );
    return {
      keycardFloor: levelController.floor.keycard,
      labels: entities
        .filter((e) => e.constructor.name === "FloorText")
        .map((e) => e.sprite?.text ?? e.text)
        .filter((text) => text === "ARMORY" || text === "INFIRMARY")
        .sort(),
      itemPickups: entities.filter((e) => e.constructor.name === "ItemPickup")
        .length,
      usablePickups: entities.filter(
        (e) => e.constructor.name === "UsablePickup",
      ).length,
    };
  });
  expect(lockedRooms.keycardFloor).toBe(true);
  expect(lockedRooms.labels).toEqual(["ARMORY", "INFIRMARY"]);
  expect(lockedRooms.itemPickups).toBe(1);
  expect(lockedRooms.usablePickups).toBeGreaterThanOrEqual(1);

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
      promptWithoutKeycard: "",
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

    // Without a keycard the lock does nothing, and says so
    await standAt(locks[0].outsidePosition);
    result.promptWithoutKeycard =
      document.querySelector(".interact-prompt")?.textContent ?? "";
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
  expect(keycards.reachableThroughDoor).not.toContain("ItemPickup");
  expect(keycards.reachableThroughDoor).not.toContain("UsablePickup");
  expect(keycards.keycardCount).toBe(1);
  expect(keycards.lockCount).toBe(2);
  expect(keycards.lockedDoorsStayShut).toBe(2);
  expect(keycards.openedWithoutKeycard).toBe(false);
  expect(keycards.promptWithoutKeycard).toBe("Card reader · needs a keycard");
  expect(keycards.keycardsPickedUp).toBe(1);
  expect(keycards.hudShown).toBe(true);
  await page.waitForTimeout(800); // let the camera settle
  await page.screenshot({ path: "tests/output/keycard-locked-door.png" });

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
    // How far it swings in 0.3 s of game time (a slow frame or two mustn't
    // cut it short), at its widest
    door.body.angularVelocity = door.maxAngle > 1 ? 6 : -6;
    const swingStart = game.elapsedTime;
    const deadline = performance.now() + 3000;
    while (
      game.elapsedTime - swingStart < 0.3 &&
      performance.now() < deadline
    ) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      result.unlockedSwing = Math.max(
        result.unlockedSwing,
        Math.abs(door.getOpenAngle()),
      );
    }
    (window as any).testPinAt = undefined;
    return result;
  });
  expect(unlocking.unlocked).toBe(true);
  expect(unlocking.keycardsLeft).toBe(0);
  expect(unlocking.lockRemoved).toBe(true);
  expect(unlocking.unlockedSwing).toBeGreaterThan(0.3);
  expect(unlocking.otherStillLocked).toBe(true);
  expectNoIssues(issues);

  // --- Floor 5: the first boss level, the Loading Dock, a horde to hold out
  // against. The directory has the whole run on it. ---
  await goToFloor(page, 5);
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    (game.entities.getTagged("directory_plaque")[0] as any).handleInteract(
      leader,
    );
  });
  await expect(page.locator(".floor-directory__row")).toHaveCount(16);
  await expect(page.locator(".floor-directory__row--here")).toHaveText(
    /5\s*Loading Dock.*You are here/,
  );
  // The bosses ahead are on the directory
  await expect(
    page.locator(".floor-directory__row", { hasText: /^10/ }),
  ).toContainText("Boss");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "tests/output/floor-directory-full.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".floor-directory")).toHaveCount(0);

  // A boss level is laid out by hand: no closets or enemies until the fight
  // starts, and the stairwell stays barred, even with the leader at its door,
  // until it's won. The fight, and the boss bar, start once the leader's out
  // of the arrival room, and then the horde comes.
  await expect(page.locator(".boss-bar")).toHaveCount(0);
  const barred = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const stairwell = game.entities.getTagged("stairwell")[0] as any;
    const doorway = stairwell.door.getDoorwayCenter();
    const outside = doorway.add(
      doorway.sub(stairwell.min.add(stairwell.max).mul(0.5)).normalize(1),
    );
    // Long enough for the arrival room to lock behind them
    const start = performance.now();
    while (performance.now() - start < 1500) {
      leader.body.position.set(outside);
      leader.body.velocity.set(0, 0);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return {
      barred: stairwell.barred,
      locked: stairwell.door.locked,
      fightStarted: (game.entities.getTagged("boss_fight")[0] as any).started,
    };
  });
  expect(barred).toEqual({ barred: true, locked: true, fightStarted: true });
  await expect(page.locator(".boss-bar__title")).toHaveText("The Horde");
  await expect(page.locator(".boss-bar__text")).toContainText("Hold out");
  await page.waitForFunction(
    () => window.DEBUG.game!.entities.getTagged("zombie").length > 0,
    null,
    { timeout: 10000 },
  );
  await page.screenshot({ path: "tests/output/boss-fight.png" });

  // A boss is always good news: holding out (the time's skipped here) leaves
  // quarters, throwables, a usable and a boss item
  const count = (name: string) =>
    page.evaluate(
      (name) =>
        [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === name,
        ).length,
      name,
    );
  const before = {
    quarters: await count("Quarter"),
    throwables: await count("ConsumablePickup"),
    usables: await count("UsablePickup"),
  };
  // (Shift+L, a dev cheat, kills the horde first, so it leaves the leader be)
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.press("KeyL");
  await page.keyboard.up("ShiftLeft");
  await page.evaluate(() => {
    const fight = window.DEBUG.game!.entities.getTagged("boss_fight")[0] as any;
    fight.goal.timeLeft = 0;
  });
  await page.waitForTimeout(500);
  expect((await count("Quarter")) - before.quarters).toBeGreaterThanOrEqual(40);
  expect((await count("ConsumablePickup")) - before.throwables).toBe(2);
  expect((await count("UsablePickup")) - before.usables).toBe(1);
  // ...and the way up is open
  expect(
    await page.evaluate(
      () =>
        (window.DEBUG.game!.entities.getTagged("stairwell")[0] as any).barred,
    ),
  ).toBe(false);
  await expect(page.locator(".boss-bar--won")).toContainText(
    "The stairwell is open",
  );
  const bossItem = await page.evaluate(async () => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const pickup = [...window.DEBUG.game!.entities.all].find(
      (e: any) =>
        e.constructor.name === "ItemPickup" && e.item.category === "boss",
    ) as any;
    leader.body.position.set(pickup.getPosition());
    await new Promise((resolve) => setTimeout(resolve, 300));
    const prompt = document.querySelector(".interact-prompt")?.textContent;
    pickup.take(leader);
    return {
      name: pickup.item.name as string,
      prompt,
      taken: leader.items.map((i: any) => i.name).includes(pickup.item.name),
    };
  });
  await page.screenshot({ path: "tests/output/boss-loot.png" });
  expect(bossItem.taken).toBe(true);
  expect([
    "Night Vision",
    "Heavy Wallet",
    "Second Heart",
    "Adrenal Gland",
  ]).toContain(bossItem.name);
  expectNoIssues(issues);
  // --- Floor 6 is after a boss: its store is big, with 8 items and a gun,
  // and enemies in act 2 are tougher ---
  await goToFloor(page, 6);
  const bigStore = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const machine = game.entities.getTagged("store_machine")[0] as any;
    machine.browse(leader);
    return {
      slots: machine.shelf.slots.length,
      gun: !!machine.shelf.gun,
      damageScales: [
        ...new Set(
          game.entities.getTagged("zombie").map((z: any) => z.damageScale),
        ),
      ],
    };
  });
  expect(bigStore).toEqual({ slots: 8, gun: true, damageScales: [1.15] });
  await expect(page.locator(".store__machine--big")).toHaveCount(1);
  await expect(page.locator(".store__slot")).toHaveCount(10);
  await page.mouse.move(1, 1);
  await page.waitForTimeout(1000);
  // Down from the top left, through the second row of four, to the gun, and
  // across to the throwable
  const selected = () =>
    page.evaluate(
      () =>
        (
          [...window.DEBUG.game!.entities.all].find(
            (e) => e.constructor.name === "StoreScreen",
          ) as any
        ).selected as number,
    );
  expect(await selected()).toBe(0);
  await page.keyboard.press("ArrowDown");
  expect(await selected()).toBe(4);
  await page.keyboard.press("ArrowDown");
  expect(await selected()).toBe(8);
  await page.keyboard.press("ArrowRight");
  expect(await selected()).toBe(9);
  await page.keyboard.press("ArrowUp");
  expect(await selected()).toBe(6);
  await page.screenshot({ path: "tests/output/big-store.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".store")).toHaveCount(0);
  expectNoIssues(issues);
});
