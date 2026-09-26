import { expect, Page, test } from "@playwright/test";
import { collectIssues, expectNoIssues, loadGame, startGame } from "./helpers";

/** Presses the level-complete cheat until the run is on `floor` and it has enemies */
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
          entities.getTagged("zombie").length > 0
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
 * the run plan (`run/acts.ts`): with seed 12345, act 1's keycard floor (3), a
 * big store after a landmark (5), and the first boss (8). The lobby and the
 * first two floors are in the smoke test.
 */
test("the run's keycard floor, big store and boss", async ({ page }) => {
  const issues = collectIssues(page);
  await loadGame(page, 12345);
  await startGame(page);

  // --- Floor 3: the act's keycard floor, with an armory and an infirmary ---
  await goToFloor(page, 3);
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
  await page.screenshot({ path: "tests/output/level-3-locked-door.png" });

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

  // --- Floor 5 is after a landmark: its store is big, with 8 items and a gun,
  // and enemies in act 2 are tougher ---
  await goToFloor(page, 5);
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
  expect(bigStore).toEqual({ slots: 8, gun: true, damageScales: [1.1] });
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

  // --- Floor 8: the Necromancer. The directory has the whole run on it. ---
  await goToFloor(page, 8);
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
    /8\s*Chapel.*You are here/,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: "tests/output/floor-directory-full.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".floor-directory")).toHaveCount(0);

  // A boss is always good news: killing it (Shift+L is a dev cheat that kills
  // every enemy) leaves quarters, throwables, a usable and a boss item
  const count = (name: string) =>
    page.evaluate(
      (name) =>
        [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === name,
        ).length,
      name,
    );
  const necromancerHp = await page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "Necromancer",
        ) as any
      )?.hp,
  );
  // 2000, tougher in act 2
  expect(necromancerHp).toBeCloseTo(2300);
  const before = {
    quarters: await count("Quarter"),
    throwables: await count("ConsumablePickup"),
    usables: await count("UsablePickup"),
  };
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.press("KeyL");
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(500);
  expect(await count("Necromancer")).toBe(0);
  expect((await count("Quarter")) - before.quarters).toBeGreaterThanOrEqual(40);
  expect((await count("ConsumablePickup")) - before.throwables).toBe(2);
  expect((await count("UsablePickup")) - before.usables).toBe(1);
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
});
