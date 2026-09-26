import { expect, test } from "@playwright/test";
import {
  collectIssues,
  expectNoIssues,
  getLeaderPosition,
  getLevelNumber,
  getLobbyPlayerPosition,
  arriveInLobby,
  loadGame,
} from "./helpers";

// See the "Seeded levels are reproducible" assertion
const LEVEL_2_FINGERPRINT = "347:-291100383";
// What the store in level 2's arrival room sells with this seed. Changes when
// the item pool, the rarities, or level generation change.
const STORE_SHELF = {
  slots: ["Curb Stomp", "Vitamins", "Linebacker", "Hollow Points"],
  gun: "Sawn Off Shotgun",
  consumable: "Frag Grenade ×2",
};
// The run's floors with this seed (from the lobby's plan). Changes when the
// themes, the landmarks or anything random before the plan changes.
const RUN_PLAN = [
  "Maintenance",
  "Offices",
  "Shops",
  "Generator",
  "Shops",
  "Maintenance",
  "Shops",
  "Chapel",
  "Maintenance",
  "Shops",
  "Offices",
  "Generator",
  "Maintenance",
  "Offices",
  "Chapel",
];
// Every quarter on a floor, in closets and carried by enemies (QUARTERS_PER_FLOOR)
const QUARTERS_PER_FLOOR = 20;

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

  // --- Boot to the title, on black, with no world behind it yet ---
  // Broken save data must not stop the game (it gets replaced at game over)
  await page.addInitScript(() => {
    window.localStorage.setItem("highriseSaveData", "{not json");
  });
  await loadGame(page, 12345);
  expect(await game()).toBeGreaterThan(0);
  await expect(page.locator(".menu-title")).toHaveText("HIGHRISE");
  expect(
    await page.evaluate(() => !!window.DEBUG.game!.entities.getById("lobby")),
  ).toBe(false);
  await page.waitForTimeout(1000); // let the title fade in
  await page.screenshot({ path: "tests/output/title.png" });
  expectNoIssues(issues);

  // --- Enter: the title goes, and the player rides up to the lobby in a closed elevator ---
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => !!window.DEBUG.game!.entities.getById("lobby"),
    null,
    { timeout: 10000 },
  );
  await expect(page.locator(".menu-title")).toHaveCount(0);
  const inElevator = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    const elevators = [...game.entities.all].filter(
      (e) => e.constructor.name === "ElevatorDoor",
    ) as any[];
    return {
      // A new save arrives as the first unlocked character
      character: lobby.player.character.name as string,
      doorOpen: lobby.arrivalDoor.openPercentage as number,
      playerToDoor: lobby.player
        .getPosition()
        .distanceTo(lobby.arrivalDoor.center) as number,
      elevatorCount: elevators.length,
      interactableElevators: [...game.entities.all].filter(
        (e: any) =>
          e.constructor.name === "Interactable" &&
          e.parent?.constructor.name === "ElevatorDoor",
      ).length,
      humans: game.entities.getTagged("human").length,
      zombies: game.entities.getTagged("zombie").length,
      visionControllers: [...game.entities.all].filter(
        (e) => e.constructor.name === "VisionController",
      ).length,
      lobbyExploredSaved: (() => {
        try {
          return !!JSON.parse(localStorage.getItem("highriseSaveData")!)
            .lobbyExplored;
        } catch {
          return false;
        }
      })(),
      cameraOnPlayer: Math.hypot(
        game.camera.x - lobby.player.getPosition()[0],
        game.camera.y - lobby.player.getPosition()[1],
      ),
      exploredDarkness: lobby.vision.exploredDarkness as number,
    };
  });
  expect(inElevator.character).toBe("Andy");
  expect(inElevator.doorOpen).toBe(0);
  expect(inElevator.playerToDoor).toBeLessThan(1.2);
  expect(inElevator.elevatorCount).toBe(12);
  expect(inElevator.interactableElevators).toBe(0);
  // Only the rescued characters are in the lobby; no enemies, no fog
  expect(inElevator.humans).toBe(3);
  expect(inElevator.zombies).toBe(0);
  // Fog of war in the lobby too, unexplored the first time
  expect(inElevator.visionControllers).toBe(1);
  expect(inElevator.lobbyExploredSaved).toBe(false);
  expect(inElevator.cameraOnPlayer).toBeLessThan(0.5);
  // What's been seen outside stays hidden until the doors open
  expect(inElevator.exploredDarkness).toBe(1);
  // Walking into the shut doors goes nowhere
  const beforeWalking = await getLobbyPlayerPosition(page);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  const afterWalking = await getLobbyPlayerPosition(page);
  expect(Math.abs(afterWalking[0] - beforeWalking[0])).toBeLessThan(0.05);
  // The elevator is moving
  expect(
    await page.evaluate(() => {
      const [x, y] = window.DEBUG.game!.camera.shakeOffset;
      return Math.hypot(x, y);
    }),
  ).toBeGreaterThan(0);
  await page.screenshot({ path: "tests/output/lobby-ride.png" });
  expectNoIssues(issues);

  // --- The elevator stops, dings open, and out you walk ---
  await page.waitForFunction(
    () =>
      (window.DEBUG.game!.entities.getById("lobby") as any).arrivalDoor
        .openPercentage === 1,
    null,
    { timeout: 15000 },
  );
  const arrived = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    return {
      shake: Math.hypot(...(game.camera.shakeOffset as [number, number])),
      exploredDarkness: lobby.vision.exploredDarkness as number,
    };
  });
  expect(arrived.shake).toBe(0);
  expect(arrived.exploredDarkness).toBeCloseTo(0.6);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  const outside = await getLobbyPlayerPosition(page);
  expect(outside[0] - beforeWalking[0]).toBeGreaterThan(1);
  // The rest of the bank stays shut
  expect(
    await page.evaluate(
      () =>
        [...window.DEBUG.game!.entities.all].filter(
          (e: any) =>
            e.constructor.name === "ElevatorDoor" && e.openPercentage > 0,
        ).length,
    ),
  ).toBe(1);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/output/lobby-arrival.png" });
  expectNoIssues(issues);

  // --- The run ahead is planned, but nothing in the lobby gives it away ---
  // 15 floors in acts of 4 (13 to 15 are act 4), with a landmark ending each
  // of the first three acts and the run, a keycard floor in each act, and
  // big stores right after the landmarks
  const plan = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    const floors = lobby.plan as any[];
    const numbers = (test: (floor: any) => boolean) =>
      floors.filter(test).map((floor) => floor.number as number);
    return {
      names: floors.map((floor) => floor.name) as string[],
      acts: floors.map((floor) => floor.act) as number[],
      gunTiers: floors.map((floor) => floor.gunTier) as number[],
      sieges: numbers((floor) => floor.landmark === "siege"),
      bosses: numbers((floor) => floor.landmark === "boss"),
      bigStores: numbers((floor) => floor.bigStore),
      keycardActs: floors
        .filter((floor) => floor.keycard)
        .map((floor) => [floor.act, !!floor.landmark]),
      plaques: game.entities.getTagged("directory_plaque").length,
    };
  });
  expect(plan.names).toEqual(RUN_PLAN);
  expect(plan.acts).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4]);
  expect(plan.gunTiers).toEqual(plan.acts.map((act) => act - 1));
  expect(plan.sieges).toEqual([4, 12]);
  expect(plan.bosses).toEqual([8, 15]);
  expect(plan.bigStores).toEqual([5, 9, 13]);
  expect(plan.keycardActs).toEqual([
    [1, false],
    [2, false],
    [3, false],
    [4, false],
  ]);
  // No theme twice in a row
  for (let i = 1; i < plan.names.length; i++) {
    expect(plan.names[i]).not.toBe(plan.names[i - 1]);
  }
  expect(plan.plaques).toBe(0);

  // --- Walk up to someone unlocked and press E to play as them ---
  /** Stands the player just below the waiting character called `name` */
  const standBy = (name: string) =>
    page.evaluate(async (name) => {
      const game = window.DEBUG.game!;
      const lobby = game.entities.getById("lobby") as any;
      const waiting = game.entities
        .getTagged("lobby_character")
        .find((c: any) => c.human.character.name === name) as any;
      const at = waiting.human.getPosition().add([0, 0.9]);
      lobby.player.body.position.set(at);
      lobby.player.body.velocity.set(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return lobby.player.getPosition().distanceTo(waiting.human.getPosition());
    }, name);
  const playingAs = () =>
    page.evaluate(
      () =>
        (window.DEBUG.game!.entities.getById("lobby") as any).player.character
          .name as string,
    );
  expect(await standBy("Nancy")).toBeLessThan(1.5);
  await expect(page.locator(".interact-prompt__title")).toHaveText("Nancy");
  await expect(page.locator(".interact-prompt__action")).toContainText(
    "Select",
  );
  const andyLeftAt = await getLobbyPlayerPosition(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  expect(await playingAs()).toBe("Nancy");
  // Andy waits where he was left, as someone to swap back to
  const andy = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const waiting = game.entities
      .getTagged("lobby_character")
      .find((c: any) => c.human.character.name === "Andy") as any;
    return waiting ? [...waiting.human.getPosition()] : undefined;
  });
  expect(andy).toBeDefined();
  expect(
    Math.hypot(andy![0] - andyLeftAt[0], andy![1] - andyLeftAt[1]),
  ).toBeLessThan(0.5);

  // --- Someone not rescued yet isn't here, and turns up once they are ---
  const lobbyCharacters = () =>
    page.evaluate(() =>
      window.DEBUG.game!.entities.getTagged("lobby_character").map(
        (c: any) => c.human.character.name as string,
      ),
    );
  expect(await lobbyCharacters()).not.toContain("Santa");
  const saveBefore = await page.evaluate(() =>
    localStorage.getItem("highriseSaveData"),
  );
  await page.evaluate(() => {
    // The save is still the corrupt one from boot; the loader fills in the rest
    let save: any = {};
    try {
      save = JSON.parse(localStorage.getItem("highriseSaveData")!) ?? {};
    } catch {}
    save.unlockedCharacters = [...(save.unlockedCharacters ?? []), "Santa"];
    localStorage.setItem("highriseSaveData", JSON.stringify(save));
  });
  await page.waitForTimeout(800);
  expect(await lobbyCharacters()).toContain("Santa");
  // Put the save back so the rest of the run sees the default unlocks
  await page.evaluate((save) => {
    localStorage.setItem("highriseSaveData", save!);
  }, saveBefore);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/output/lobby-characters.png" });
  expectNoIssues(issues);

  // --- The pause menu works in the lobby, with the credits instead of quitting ---
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  await expect(
    page.locator(".menu-button", { hasText: "Credits" }),
  ).toHaveCount(1);
  await expect(
    page.locator(".menu-button", { hasText: "Quit Run" }),
  ).toHaveCount(0);
  await page.locator(".menu-button", { hasText: "Credits" }).click();
  await expect(page.locator(".credits")).toBeVisible();
  await expect(page.locator(".pause-menu__background")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".credits")).toHaveCount(0);
  await expect(page.locator(".pause-menu__background")).toHaveCount(1);
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);

  // --- Up the stairs: through the stairwell's one-way door, onto the stairs ---
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    const door = [...game.entities.all].find(
      (e) => e.constructor.name === "Door",
    ) as any;
    // In the hallway, a couple of meters left of the doorway
    lobby.player.body.position.set(door.getDoorwayCenter().add([-2, 0]));
    lobby.player.body.velocity.set(0, 0);
  });
  await page.waitForTimeout(200);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1100);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");
  await page.waitForFunction(
    () => {
      const entities = window.DEBUG.game!.entities;
      return (
        !entities.getById("lobby") &&
        entities.getTagged("human").length > 0 &&
        entities.getTagged("zombie").length > 0
      );
    },
    null,
    { timeout: 30000 },
  );

  // --- The run starts on its first floor, as Nancy ---
  const startLevel = await getLevelNumber(page);
  expect(startLevel).toBe(1);
  const runStart = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const partyManager = entities.find(
      (e) => e.constructor.name === "PartyManager",
    );
    const arrivalRoom = entities.find(
      (e) => e.constructor.name === "ArrivalRoom",
    );
    return {
      leader: partyManager.leader.character.name as string,
      startingGun: partyManager.leader.weapon?.stats.name as string,
      stores: game.entities.getTagged("store_machine").length,
      arrivalRooms: entities.filter((e) => e.constructor.name === "ArrivalRoom")
        .length,
      gunsInArrivalRoom: entities.filter(
        (e) =>
          e.constructor.name === "WeaponPickup" &&
          arrivalRoom?.contains(e.getPosition()),
      ).length,
      // Lying in closets, and carried by enemies
      quarters:
        entities.filter((e) => e.constructor.name === "Quarter").length +
        entities
          .filter(
            (e) =>
              e.constructor.name !== "PartyManager" &&
              typeof e.quarters === "number",
          )
          .reduce((sum, e) => sum + e.quarters, 0),
      floor: entities.find((e) => e.constructor.name === "LevelController")
        .floor.name as string,
      lastCharacter: JSON.parse(
        window.localStorage.getItem("highriseSaveData")!,
      ).lastCharacter as string,
    };
  });
  // Nancy starts with her own pistol, and the arrival room has no guns in it,
  // and no store on the first floor. The floor's quarters were all placed.
  expect(runStart).toEqual({
    leader: "Nancy",
    startingGun: "M1911",
    stores: 0,
    arrivalRooms: 1,
    gunsInArrivalRoom: 0,
    quarters: QUARTERS_PER_FLOOR,
    floor: RUN_PLAN[0],
    lastCharacter: "Nancy",
  });
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

  // --- The flashlight starts off, and F turns it on (and says so in the HUD) ---
  const leaderFlashlightOn = () =>
    page.evaluate(
      () =>
        (
          [...window.DEBUG.game!.entities.all].find(
            (e) => e.constructor.name === "PartyManager",
          ) as any
        ).leader.flashlight.isOn as boolean,
    );
  expect(await leaderFlashlightOn()).toBe(false);
  await expect(page.locator(".hud-flashlight")).toContainText("Off");
  await page.keyboard.press("KeyF");
  expect(await leaderFlashlightOn()).toBe(true);
  await expect(page.locator(".hud-flashlight")).toContainText("On");

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
  // (Guns are only bought now, so none are lying around: KeyJ is a dev cheat
  // that drops an AR-15 at the leader's feet.) Pin the player and a zombie in
  // place so that the shots can't miss.
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    // The nearest gun, and then back to the spawn room, from its left side
    // so that there's room to shoot across it
    const home = ([...game.entities.all] as any[])
      .filter((e) => e.constructor.name === "SpawnLocation")
      .map((e) => e.position.clone())
      .sort((a, b) => a[0] - b[0])[0];
    (window as any).testHome = home;
    leader.body.position.set(home);
    leader.body.velocity.set(0, 0);
  });
  await page.waitForTimeout(300);
  await page.keyboard.press("KeyJ");
  await page.waitForTimeout(300);
  // Standing on it, the prompt says what E picks up (with a slot free, it
  // replaces nothing), and it's ringed on the floor
  await expect(page.locator(".interact-prompt")).toContainText("AR-15");
  await expect(page.locator(".interact-prompt")).not.toContainText("replaces");
  await expect(page.locator(".interact-prompt__key")).toHaveText("E");
  expect(
    await page.evaluate(() => {
      const prompt = [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "InteractPrompt",
      ) as any;
      return {
        target: prompt?.target?.parent?.constructor.name,
        highlighted: !!prompt?.highlight?.sprite.visible,
      };
    }),
  ).toEqual({ target: "WeaponPickup", highlighted: true });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(500);
  const targetHp = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    leader.body.position.set((window as any).testHome);
    leader.body.velocity.set(0, 0);
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

  // --- Two free weapon slots: a new weapon goes in the empty one, Q swaps,
  // and with both full a new one replaces the one in hand ---
  const getSlots = () =>
    page.evaluate(() => {
      const leader = (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader;
      return {
        slots: leader.weapons.map((w: any) => w?.stats.name ?? null),
        active: leader.activeSlot as number,
        inHand: leader.weapon?.stats.name as string | undefined,
        pistolReserve: leader.reserve.pistol as number,
      };
    });
  // Nancy's own pistol, and the AR-15 from above in the other slot, in hand
  const slots = await getSlots();
  expect(slots.slots).toEqual(["M1911", "AR-15"]);
  expect(slots.inHand).toBe("AR-15");
  await expect(page.locator(".hud-inventory")).toContainText("M1911");
  // Q used to throw glowsticks; now it swaps weapons, and glowsticks are gone
  await page.keyboard.press("KeyQ");
  await page.waitForTimeout(350);
  const swapped = await getSlots();
  expect(swapped.active).toBe(0);
  expect(swapped.inHand).toBe("M1911");
  expect(
    await page.evaluate(
      () =>
        [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === "GlowStick",
        ).length,
    ),
  ).toBe(0);
  // Pistol ammo runs out like the rest now
  await expect(page.locator(".hud-reserve")).toHaveText(
    String(swapped.pistolReserve),
  );
  await expect(page.locator(".hud-inventory")).toContainText("AR-15");
  // The mouse wheel swaps too
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(350);
  expect((await getSlots()).inHand).toBe("AR-15");
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(350);
  expect((await getSlots()).inHand).toBe("M1911");
  // Both full: another AR-15 replaces the pistol in hand, which is dropped...
  await page.keyboard.press("KeyJ");
  await page.waitForTimeout(300);
  await expect(page.locator(".interact-prompt")).toContainText(
    "replaces M1911",
  );
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  expect(await getSlots()).toMatchObject({
    slots: ["AR-15", "AR-15"],
    active: 0,
  });
  // ...where it can be picked up again, replacing the new AR-15
  await expect(page.locator(".interact-prompt")).toContainText("M1911");
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  expect(await getSlots()).toMatchObject({
    slots: ["M1911", "AR-15"],
    active: 0,
    inHand: "M1911",
  });

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
    // The pistol in hand: pistols reload from the reserve too now
    const gun = leader.weapon;
    const ammoClass = gun.stats.ammoClass;
    const capacity = gun.getCapacity(leader);
    gun.ammo = 0;
    leader.reserve[ammoClass] = capacity + 5;
    leader.reload();
    const start = performance.now();
    while (gun.isReloading && performance.now() - start < 6000) {
      await wait(50);
    }
    const result = {
      ammoClass,
      capacity,
      reloadedAmmo: gun.ammo,
      reserveLeft: leader.reserve[ammoClass],
      emptyReloadStarted: false,
      ammoAfterEmptyReload: -1,
    };
    gun.ammo = 0;
    leader.reserve[ammoClass] = 0;
    leader.reload();
    await wait(100);
    result.emptyReloadStarted = gun.isReloading;
    result.ammoAfterEmptyReload = gun.ammo;
    return result;
  });
  expect(reserveReload.ammoClass).toBe("pistol");
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

  // --- The usable slot: C uses a charge of a health pack, which heals over a
  // couple of seconds; a stim swaps it out and makes the leader faster and
  // tougher for a while (KeyZ is a dev cheat: a health pack, or with shift a
  // stim pack) ---
  const usableState = () =>
    page.evaluate(() => {
      const leader = (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "PartyManager",
        ) as any
      ).leader;
      return {
        name: leader.usable?.stats.name as string | undefined,
        charges: leader.usable?.charges as number | undefined,
        hp: leader.hp as number,
        moveSpeed: leader.stats.moveSpeed as number,
        damageTaken: leader.stats.damageTaken as number,
      };
    });
  await page.keyboard.press("KeyZ");
  await expect(page.locator(".hud-item--usable")).toContainText("Health Pack");
  await expect(page.locator(".hud-item--usable")).toContainText("×3");
  const setLeader = (hp: number, damageTaken: number) =>
    page.evaluate(
      ([hp, damageTaken]) => {
        const leader = (
          [...window.DEBUG.game!.entities.all].find(
            (e) => e.constructor.name === "PartyManager",
          ) as any
        ).leader;
        leader.hp = hp;
        leader.stats.damageTaken = damageTaken;
      },
      [hp, damageTaken],
    );
  // (Nothing hurts the leader meanwhile, so the heal is all that changes hp)
  await setLeader(50, 0);
  await page.keyboard.press("KeyC");
  await expect.poll(async () => (await usableState()).hp).toBeCloseTo(90, 0);
  const healed = await usableState();
  expect(healed.charges).toBe(2);
  await setLeader(healed.hp, 1);
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.press("KeyZ");
  await page.keyboard.up("ShiftLeft");
  expect((await usableState()).name).toBe("Stim Pack");
  // The health pack it replaced is on the floor, with what was left in it
  expect(
    await page.evaluate(() =>
      ([...window.DEBUG.game!.entities.all] as any[])
        .filter((e) => e.constructor.name === "UsablePickup")
        .map((e) => [e.stats.name, e.charges]),
    ),
  ).toContainEqual(["Health Pack", 2]);
  await page.keyboard.press("KeyC");
  await page.waitForTimeout(200);
  const stimmed = await usableState();
  expect(stimmed.charges).toBe(1);
  expect(stimmed.moveSpeed).toBeCloseTo(healed.moveSpeed * 1.3);
  expect(stimmed.damageTaken).toBeCloseTo(0.6);
  await page.screenshot({ path: "tests/output/usable.png" });
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

  // --- Fire: with incendiary rounds, a bullet sets a zombie alight, and it
  // burns for a while without blood or flinching, then goes out ---
  const lit = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const zombie = game.entities
      .getTagged("zombie")
      .find((e) => e.constructor.name === "Zombie") as any;
    zombie.stun(20);
    zombie.hp = 1000; // so it outlives the fire
    (window as any).testZombie = zombie;
    const shot = (shooter: any) => {
      const origin = zombie.getPosition();
      zombie.hitByBullet(
        { damage: 1, velocity: origin.mul(0), stats: { mass: 0 }, shooter },
        origin,
        origin.mul(0),
      );
      return !!zombie.burning;
    };
    const litWithout = shot(leader);
    leader.stats.incendiaryRounds = true;
    const litWith = shot(leader);
    leader.stats.incendiaryRounds = false;
    return { litWithout, litWith, hp: zombie.hp as number };
  });
  expect(lit.litWithout).toBe(false);
  expect(lit.litWith).toBe(true);
  await page.waitForTimeout(2000);
  const burnt = await page.evaluate(() => {
    const zombie = (window as any).testZombie;
    return { hp: zombie.hp as number, burning: !!zombie.burning };
  });
  expect(burnt.burning).toBe(true);
  expect(lit.hp - burnt.hp).toBeGreaterThan(10);
  await page.waitForTimeout(3000); // enemies burn for 4 seconds
  expect(
    await page.evaluate(() => {
      const zombie = (window as any).testZombie;
      (window as any).testZombie = undefined;
      const burning = !!zombie.burning;
      zombie.destroy();
      return {
        burning,
        fires: [...window.DEBUG.game!.entities.all].filter(
          (e) => e.constructor.name === "Burning",
        ).length,
      };
    }),
  ).toEqual({ burning: false, fires: 0 });

  // --- Fire on the floor spreads along fuel, and not through walls ---
  const spread = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const grid = [...game.entities.all].find(
      (e) => e.constructor.name === "FireGrid",
    ) as any;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // Both faces of the first wall to the right of the spawn room
    const home = (window as any).testHome;
    const walls = { collisionMask: 1 };
    const nearFace = game.world.raycast(home, home.add([30, 0]), walls)!;
    const nearX = nearFace.point[0];
    const farFace = game.world.raycast(
      home.add([nearX - home[0] + 3, 0]),
      home.add([nearX - home[0] - 0.1, 0]),
      walls,
    )!;
    const near = home.add([nearX - home[0] - 0.3, 0]);
    const far = home.add([farFace.point[0] - home[0] + 0.3, 0]);
    // A trail of fuel along the wall, and a puddle at it that doesn't leak
    // through it
    grid.addFuelAlong(near.add([0, -1.5]), near.add([0, 1.5]), 5);
    grid.spillFuel(near, 1.5, 5);
    const leaked = grid.fuelAt(far);
    // A puddle right across the wall that isn't lit
    grid.spillFuel(far, 1, 5);
    const lit = grid.igniteAt(near.add([0, -1.5]));
    await wait(1000);
    const result = {
      lit,
      leaked,
      trailEnd: grid.isBurningAt(near.add([0, 1.5])),
      acrossWall: grid.isBurningAt(far),
    };
    grid.clear();
    return result;
  });
  expect(spread).toEqual({
    lit: true,
    leaked: 0,
    trailEnd: true,
    acrossWall: false,
  });

  // --- A molotov breaks where it lands and sets whoever is there alight ---
  await page.keyboard.press("KeyX"); // dev cheat: molotovs
  await expect(page.locator(".hud-inventory")).toContainText("Molotov");
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
    zombie.hp = 1000;
    (window as any).testZombie = zombie;
    // Thrown in a direction with no wall for a while
    const home = leader.getPosition().clone();
    let angle = 0;
    for (let i = 0; i < 16; i++) {
      angle = (i / 16) * Math.PI * 2;
      const to = home.add([Math.cos(angle) * 5, Math.sin(angle) * 5]);
      if (!game.world.raycast(home, to, { collisionMask: 1 | 2 })) break;
    }
    const pin = () => {
      if (
        zombie.isDestroyed ||
        leader.isDestroyed ||
        !(window as any).testZombie
      )
        return;
      leader.hp = leader.maxHp;
      leader.body.position.set(home);
      leader.body.velocity.set(0, 0);
      leader.body.angle = angle;
      zombie.body.position.set(
        home.add([Math.cos(angle) * 3, Math.sin(angle) * 3]),
      );
      zombie.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    pin();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader.useConsumable(),
  );
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "tests/output/molotov.png" });
  const molotov = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const zombie = (window as any).testZombie;
    const grid = [...game.entities.all].find(
      (e) => e.constructor.name === "FireGrid",
    ) as any;
    (window as any).testZombie = undefined; // unpin
    const result = {
      zombieBurning: !!zombie.burning,
      floorBurning: grid.isBurningAt(zombie.getPosition()),
      thrown: [...game.entities.all].filter(
        (e) => e.constructor.name === "ThrownConsumable",
      ).length,
    };
    zombie.destroy();
    // Put it all out, so the rest of the test isn't on fire
    grid.clear();
    return result;
  });
  expect(molotov).toEqual({
    zombieBurning: true,
    floorBurning: true,
    thrown: 0,
  });
  expectNoIssues(issues);

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

  // --- Only one floor per act has the keycard and its locked rooms, and
  // with this seed it's floor 3, not this one (see run.spec.ts) ---
  expect(
    await page.evaluate(
      () =>
        [...window.DEBUG.game!.entities.all].filter((e) =>
          ["Keycard", "KeycardLock"].includes(e.constructor.name),
        ).length,
    ),
  ).toBe(0);

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
    // Whatever kind it was placed as, it starts out as a snack machine here
    machine.kind = "snack";
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
  await expect(page.locator(".interact-prompt")).toHaveText(
    "ESnack machine · 3 quarters",
  );
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
    machine.buy(partyManager.leader);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const quartersAfter = partyManager.quarters;
    partyManager.quarters = quarters;
    return quartersAfter;
  });
  expect(brokeBuy).toBe(2);
  expect(await countHealthPickups()).toBe(healthPickupsBefore + 1);

  // The same machine as the other kinds (switched in place: a floor has only
  // two machines, so it may not have all three)
  const otherKinds = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const entities = () => [...game.entities.all] as any[];
    const partyManager = entities().find(
      (e) => e.constructor.name === "PartyManager",
    );
    const leader = partyManager.leader;
    const machine = (window as any).testMachine;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const count = (name: string) =>
      entities().filter((e) => e.constructor.name === name).length;
    partyManager.quarters = 20;

    // Ammo: a box for the gun in hand
    machine.kind = "ammo";
    const gunClass = leader.weapon.stats.ammoClass;
    const ammoPrompt = machine.interactable.prompt(leader);
    // With a melee weapon (or nothing) in hand there's nothing to sell
    const meleePrompt = machine.interactable.prompt({ weapon: undefined });
    const boxesBefore = count("AmmoPickup");
    machine.buy(leader);
    await wait(1200);
    const ammo = {
      gunClass,
      ammoPrompt,
      meleePrompt,
      quarters: partyManager.quarters,
      boxes: count("AmmoPickup") - boxesBefore,
      boxClass: entities()
        .filter((e) => e.constructor.name === "AmmoPickup")
        .map((e) => e.ammoClass)
        .pop(),
    };

    // Grenade: one of the kind it was stocked with
    machine.kind = "grenade";
    const grenadePrompt = machine.interactable.prompt(leader);
    const grenadesBefore = count("ConsumablePickup");
    const quartersBefore = partyManager.quarters;
    machine.buy(leader);
    await wait(1200);
    const grenade = {
      grenadePrompt,
      name: machine.grenade.name,
      spent: quartersBefore - partyManager.quarters,
      pickups: count("ConsumablePickup") - grenadesBefore,
    };
    machine.kind = "snack";
    return { ammo, grenade };
  });
  expect(otherKinds.ammo.gunClass).toBe("pistol");
  expect(otherKinds.ammo.ammoPrompt).toEqual({
    title: "Ammo machine",
    detail: "30 pistol rounds · 2 quarters",
  });
  expect(otherKinds.ammo.meleePrompt).toEqual({
    title: "Ammo machine",
    hint: "nothing fits",
  });
  expect(otherKinds.ammo.quarters).toBe(18);
  expect(otherKinds.ammo.boxes).toBe(1);
  expect(otherKinds.ammo.boxClass).toBe("pistol");
  expect(otherKinds.grenade.grenadePrompt).toEqual({
    title: "Grenade machine",
    detail: `${otherKinds.grenade.name} · 4 quarters`,
  });
  expect(otherKinds.grenade.spent).toBe(4);
  expect(otherKinds.grenade.pickups).toBe(1);

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
      allyLeftQuarter: false,
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

      // An ally walking over a quarter leaves it for the leader
      const quartersBefore = partyManager.quarters;
      // (further from the leader than the survivor was, so only the survivor is on it)
      const spot = doorway.add(inward.map((x) => x * -0.3));
      const quarter = entities
        .find((e) => e.constructor.name === "QuarterDropper")
        .dropQuarter(spot, false);
      for (let i = 0; i < 20; i++) {
        survivor.body.position.set(spot);
        survivor.body.velocity.set(0, 0);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      result.allyLeftQuarter =
        !quarter.isDestroyed && partyManager.quarters === quartersBefore;
      quarter.destroy();
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
  expect(stairwell.allyLeftQuarter).toBe(true);
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
  // Guns → Melee → Consumables, where the frag grenades, molotovs, health
  // pack and stim pack carried earlier are known and flashbangs aren't
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(selectedTab).toContainText("Consumables");
  // (and after them the usables, both carried earlier)
  await expect(selectedTab).toContainText("4 / 5");
  await expect(gunEntries).toHaveCount(5);
  await expect(gunEntries.nth(0)).toContainText("Frag Grenade");
  await expect(gunEntries.nth(1)).toHaveText("???");
  await expect(gunEntries.nth(2)).toContainText("Molotov");
  await gunEntries.nth(0).click();
  await expect(detail).toContainText("Blast radius");
  await expect(
    page.locator(".encyclopedia__detail-image img[src^='data:image/svg']"),
  ).toHaveCount(1);
  await page.mouse.move(1, 1);
  await page.screenshot({ path: "tests/output/encyclopedia-consumables.png" });
  // → Items → Enemies, where the zombie shot earlier is known
  for (let i = 0; i < 2; i++) {
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
  expect([...seen.consumables].sort()).toEqual([
    "Frag Grenade",
    "Health Pack",
    "Molotov",
    "Stim Pack",
  ]);
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
  // Whoever is in the stairwell with the leader makes it out
  const exitingFlashlightsOn = await page.evaluate(() => {
    const allies = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).getAllies();
    (window as any).testExitingAllies = allies;
    return allies.filter((a: any) => a.flashlight.light.enabled).length;
  });
  await page.keyboard.press("KeyL");

  // --- The ally in the stairwell made it out, and is unlocked for good ---
  await expect(page.locator(".survivor-toast")).toContainText(
    `${stairwell.allyName} made it out!`,
  );
  // and turned their flashlight off on the way up the stairs
  expect(exitingFlashlightsOn).toBeGreaterThan(0);
  expect(
    await page.evaluate(() =>
      (window as any).testExitingAllies.some(
        (a: any) => a.flashlight.light.enabled,
      ),
    ),
  ).toBe(false);
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

  // --- The second floor's spawn room has the building directory on the wall ---
  // (The first floor has none: the run ahead is a mystery until then)
  const directory = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const leader = (
      [...game.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    const plaque = game.entities.getTagged("directory_plaque")[0] as any;
    if (!plaque) {
      return { plaques: 0 };
    }
    const [x, y] = plaque.position;
    leader.body.position.set([x, y + 0.9]);
    leader.body.velocity.set(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      plaques: game.entities.getTagged("directory_plaque").length,
      prompt: document.querySelector(".interact-prompt__title")?.textContent,
    };
  });
  expect(directory.plaques).toBe(1);
  expect(directory.prompt).toBe("Directory");
  await page.keyboard.press("KeyE");
  await expect(page.locator(".floor-directory")).toHaveCount(1);
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(true);
  expect(await page.locator(".pause-menu__background").count()).toBe(0);
  // The whole run, top floor first, with this one marked and the rest noted
  const directoryRows = page.locator(".floor-directory__row");
  await expect(directoryRows).toHaveCount(16);
  await expect(directoryRows.nth(0)).toHaveText(/15\s*Chapel\s*Boss/);
  await expect(directoryRows.nth(3)).toHaveText(/12\s*Generator\s*Landmark/);
  await expect(directoryRows.nth(10)).toHaveText(/5\s*Shops\s*Store/);
  await expect(directoryRows.nth(13)).toHaveText(
    new RegExp(`2\\s*${RUN_PLAN[1]}.*You are here`),
  );
  await expect(directoryRows.nth(15)).toHaveText(/L\s*Lobby/);
  await page.screenshot({ path: "tests/output/floor-directory.png" });
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await expect(page.locator(".floor-directory")).toHaveCount(0);
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);
  expectNoIssues(issues);

  // --- The second floor's arrival room has the store: a vending machine
  // with a shelf dealt for this floor. (The first floor has none.) ---
  const store = await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const machines = game.entities.getTagged("store_machine") as any[];
    const arrivalRoom = [...game.entities.all].find(
      (e) => e.constructor.name === "ArrivalRoom",
    ) as any;
    const shelf = machines[0]?.shelf;
    return {
      machines: machines.length,
      inArrivalRoom: !!arrivalRoom?.contains(machines[0]?.position),
      shelf: shelf && {
        slots: shelf.slots.map((item: any) => item?.name ?? null),
        gun: shelf.gun?.name ?? null,
        consumable: shelf.consumable?.name ?? null,
      },
    };
  });
  expect(store.machines).toBe(1);
  expect(store.inArrivalRoom).toBe(true);
  // Seeded, and dealt after the level is generated, so always the same shelf
  expect(store.shelf).toEqual(STORE_SHELF);

  const storeState = () =>
    page.evaluate(() => {
      const entities = [...window.DEBUG.game!.entities.all] as any[];
      const partyManager = entities.find(
        (e) => e.constructor.name === "PartyManager",
      );
      const screen = entities.find((e) => e.constructor.name === "StoreScreen");
      return {
        items: partyManager.leader.items.map((i: any) => i.name) as string[],
        quarters: partyManager.quarters as number,
        paused: window.DEBUG.game!.paused,
        selected: screen?.selected as number | undefined,
      };
    });
  // In front of the machine, with no quarters, and the mouse out of the way
  // (hovering a slot selects it)
  await page.mouse.move(1, 1);
  const storePrompt = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const partyManager = [...game.entities.all].find(
      (e) => e.constructor.name === "PartyManager",
    ) as any;
    const leader = partyManager.leader;
    partyManager.quarters = 0;
    const machine = game.entities.getTagged("store_machine")[0] as any;
    // It faces into the room, along its local -y
    const r = machine.sprite.rotation;
    leader.body.position.set(
      machine.position.add([Math.sin(r) * 1.1, -Math.cos(r) * 1.1]),
    );
    leader.body.velocity.set(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return document.querySelector(".interact-prompt__title")?.textContent;
  });
  expect(storePrompt).toBe("Vending machine");
  await page.keyboard.press("KeyE");
  await expect(page.locator(".store")).toHaveCount(1);
  await expect(page.locator(".store__slot")).toHaveCount(6);
  expect((await storeState()).paused).toBe(true);
  expect(await page.locator(".pause-menu__background").count()).toBe(0);
  // The E that opened it doesn't count for a moment (game time, which is
  // slower than the clock when frames are slow)
  await page.waitForTimeout(1000);
  // Can't afford it: the display says so, and nothing is sold
  await page.keyboard.press("Enter");
  await expect(page.locator(".store__display")).toHaveText(
    "INSUFFICIENT FUNDS",
  );
  await page.screenshot({ path: "tests/output/store.png" });
  expect((await storeState()).items).toEqual([]);
  // Escape closes it, and the game goes on
  await page.keyboard.press("Escape");
  await expect(page.locator(".store")).toHaveCount(0);
  expect((await storeState()).paused).toBe(false);

  // With some quarters, buying the first slot: it wiggles, drops, and is theirs
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("KeyK"); // dev cheat: +5 quarters
  }
  await page.keyboard.press("KeyE");
  await expect(page.locator(".store")).toHaveCount(1);
  await page.waitForTimeout(1000);
  const firstSlot = page.locator(".store__slot").nth(0);
  const firstPrice = Number(
    await firstSlot.locator(".store__price").innerText(),
  );
  await page.keyboard.press("Enter");
  await expect(page.locator(".store__slot--vending")).toHaveCount(1);
  await expect(page.locator(".store__display")).toHaveText("VENDING");
  await expect(firstSlot).toHaveClass(/store__slot--empty/);
  await expect(firstSlot).toContainText("Sold out");
  const afterBuying = await storeState();
  expect(afterBuying.items).toEqual([STORE_SHELF.slots[0]]);
  expect(afterBuying.quarters).toBe(25 - firstPrice);
  expect(afterBuying.paused).toBe(true);
  // A sold-out slot sells nothing
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  expect((await storeState()).items).toEqual([STORE_SHELF.slots[0]]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".store")).toHaveCount(0);

  // A gun from the bottom row goes in its slot, loaded and in hand, and the
  // gun it replaces is traded in. (The shelf is given another gun, which
  // replaces the AR-15 from the first floor in hand, and an item the leader
  // already has.)
  const gunOffer = await page.evaluate(() => {
    const entities = [...window.DEBUG.game!.entities.all] as any[];
    const levelController = entities.find(
      (e) => e.constructor.name === "LevelController",
    );
    const partyManager = entities.find(
      (e) => e.constructor.name === "PartyManager",
    );
    const leader = partyManager.leader;
    let card: any;
    for (let i = 0; i < 200 && !card; i++) {
      const gun = levelController.dealShelf(leader).gun;
      if (gun) {
        card = gun;
      }
    }
    const shelf = levelController.template.shelf;
    shelf.gun = card;
    shelf.slots[1] = leader.items[0];
    partyManager.quarters = 100;
    // Both slots are full, so it replaces the one in hand: the AR-15
    leader.activeSlot = leader.weapons.findIndex(
      (w: any) => w?.stats.name === "AR-15",
    );
    (window as any).testGunSlot = leader.activeSlot;
    return {
      name: card.name as string,
      price: card.price as number,
      replaced: leader.weapon?.stats.name as string | undefined,
    };
  });
  expect(gunOffer.replaced).toBe("AR-15");
  await page.keyboard.press("KeyE");
  await expect(page.locator(".store")).toHaveCount(1);
  await expect(page.locator(".store__slot").nth(1)).toContainText(/Own 1/);
  await expect(page.locator(".store__slot").nth(4)).toContainText(
    gunOffer.name,
  );
  await expect(
    page.locator(".store__slot").nth(4).locator(".store__image"),
  ).toHaveCount(1);
  await page.waitForTimeout(1000);
  // From the first slot for sale (the top right), down to the bottom row and
  // left to the gun
  expect((await storeState()).selected).toBe(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  expect((await storeState()).selected).toBe(4);
  await page.screenshot({ path: "tests/output/store-gun.png" });
  await page.keyboard.press("Enter");
  await expect(page.locator(".store__slot").nth(4)).toHaveClass(
    /store__slot--empty/,
  );
  const boughtGun = await page.evaluate(() => {
    const entities = [...window.DEBUG.game!.entities.all] as any[];
    const partyManager = entities.find(
      (e) => e.constructor.name === "PartyManager",
    );
    const leader = partyManager.leader;
    const gun = leader.weapons[(window as any).testGunSlot];
    return {
      inSlot: gun?.stats.name,
      inHand: leader.weapon === gun,
      full: gun?.ammo === gun?.getCapacity(leader),
      quarters: partyManager.quarters,
      // Sold, not dropped
      dropped: entities.some(
        (e) =>
          e.constructor.name === "WeaponPickup" &&
          e.weapon.stats.name === "AR-15",
      ),
    };
  });
  expect(boughtGun).toEqual({
    inSlot: gunOffer.name,
    inHand: true,
    full: true,
    // The AR-15 is tier 2, which sells for 20: half of that back
    quarters: 100 - gunOffer.price + 10,
    dropped: false,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator(".store")).toHaveCount(0);
  expectNoIssues(issues);

  // --- The item stuck, and nothing else changed ---
  const afterStore = await page.evaluate(() => {
    const leader = (
      [...window.DEBUG.game!.entities.all].find(
        (e) => e.constructor.name === "PartyManager",
      ) as any
    ).leader;
    return {
      stats: leader.stats,
      items: leader.items.map((i: any) => i.name),
    };
  });
  expect(afterStore.items).toEqual([STORE_SHELF.slots[0], gunOffer.name]);
  expect(afterStore.stats).not.toEqual(statsBefore);

  // --- Leaving the arrival room: its door swings out, and locks for good once
  // the leader is out, so it won't swing back in ---
  const arrival = await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const entities = [...game.entities.all] as any[];
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const room = entities.find((e) => e.constructor.name === "ArrivalRoom");
    const door = room.door;
    const wait = async (ms: number) => {
      const start = performance.now();
      while (performance.now() - start < ms) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    };
    const result = {
      oneWay: door.oneWay === 1 || door.oneWay === -1,
      lockedWhileInside: door.locked,
      sealedWhileInside: room.sealed,
      sealed: false,
      locked: false,
      inwardSwing: 1,
    };
    // Which way is out? The doorway is on the edge of the room's box.
    const doorway = door.getDoorwayCenter();
    const { min, max } = room;
    const outward =
      Math.abs(doorway[0] - min[0]) < 0.01
        ? [-1, 0]
        : Math.abs(doorway[0] - max[0]) < 0.01
          ? [1, 0]
          : Math.abs(doorway[1] - min[1]) < 0.01
            ? [0, -1]
            : [0, 1];
    const outside = doorway.add(outward.map((x) => x * 2));
    const start = performance.now();
    while (performance.now() - start < 2000) {
      leader.hp = leader.maxHp;
      leader.body.position.set(outside);
      leader.body.velocity.set(0, 0);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    result.sealed = room.sealed;
    result.locked = door.locked;
    // Shoved inwards (against the way it opens), it barely moves
    door.body.angle = door.restingAngle;
    door.body.angularVelocity = -6 * door.oneWay;
    await wait(300);
    result.inwardSwing = -door.getOpenAngle() * door.oneWay;
    // Back inside, where it's safe now, for the rest of the test (the hallway
    // outside tends to fill up with zombies)
    // A little right of the middle, with room either side for what's next
    leader.body.position.set(min.add(max).mul(0.5).add([1, 0]));
    leader.body.velocity.set(0, 0);
    return result;
  });
  expect(arrival).toEqual({
    oneWay: true,
    lockedWhileInside: false,
    sealedWhileInside: false,
    sealed: true,
    locked: true,
    inwardSwing: expect.any(Number),
  });
  expect(arrival.inwardSwing).toBeLessThan(0.1);
  expectNoIssues(issues);

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
  await page.screenshot({ path: "tests/output/level-2-stats.png" });
  expectNoIssues(issues);

  // --- Dealing: four different items, a gun every time (one from
  // this floor's closet tier or the one above, tiers 1 and 2 in act 1, that
  // the leader isn't carrying and no store has had this run), and always a consumable; never an item the
  // leader can't take again. (Dealing uses up randomness, so this comes after
  // everything that depends on the seed.) ---
  const deals = await page.evaluate(() => {
    const entities = [...window.DEBUG.game!.entities.all] as any[];
    const levelController = entities.find(
      (e) => e.constructor.name === "LevelController",
    );
    const leader = entities.find(
      (e) => e.constructor.name === "PartyManager",
    ).leader;
    const shelves: any[] = [];
    for (let i = 0; i < 100; i++) {
      shelves.push(levelController.dealShelf(leader));
    }
    const guns = shelves.map((shelf) => shelf.gun).filter(Boolean);
    return {
      slotCounts: [...new Set(shelves.map((shelf) => shelf.slots.length))],
      allDifferent: shelves.every(
        (shelf) =>
          new Set(shelf.slots.map((item: any) => item?.name)).size ===
          shelf.slots.length,
      ),
      allFull: shelves.every((shelf) => shelf.slots.every(Boolean)),
      allConsumables: shelves.every((shelf) => shelf.consumable),
      gunCount: guns.length,
      gunNames: [...new Set(guns.map((gun: any) => gun.name as string))],
      gunDescriptions: [
        ...new Set(guns.map((gun: any) => gun.description as string)),
      ],
      held: leader.guns.map((gun: any) => gun.stats.name as string),
      dealtItems: [
        ...new Set(
          shelves.flatMap((shelf) =>
            shelf.slots.map((item: any) => item.name as string),
          ),
        ),
      ],
      maxedOut: leader.items
        .filter(
          (item: any) =>
            item.maxStacks !== undefined &&
            leader.items.filter((i: any) => i === item).length >=
              item.maxStacks,
        )
        .map((item: any) => item.name as string),
    };
  });
  expect(deals.slotCounts).toEqual([4]);
  expect(deals.allDifferent).toBe(true);
  expect(deals.allFull).toBe(true);
  expect(deals.allConsumables).toBe(true);
  expect(deals.gunCount).toBe(100);
  for (const name of deals.gunNames) {
    expect([
      "M1911",
      "Glock",
      "S&W Revolver",
      "Five Seven",
      "Desert Eagle",
      "AR-15",
      "Sawn Off Shotgun",
    ]).toContain(name);
    expect(deals.held).not.toContain(name);
    expect(name).not.toBe(STORE_SHELF.gun);
  }
  for (const description of deals.gunDescriptions) {
    expect(description).toMatch(
      /^Tier [12] · \d+ (rounds|shells) · (semi auto|full auto|pump action)$/,
    );
  }
  for (const name of deals.maxedOut) {
    expect(deals.dealtItems).not.toContain(name);
  }
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
  // This floor's survivor joins (if they haven't) (tried on each side of the leader until one
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
      weaponsCarried: 0,
      droppedWeapons: [] as [number, number][],
    };
    // (They may have joined already, while the leader was out in the hallway)
    const ally = survivorController?.human ?? partyManager.getAllies()[0];
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
    const carried = leader.weapons.filter((w: any) => w);
    result.weaponsCarried = carried.length;
    leader.hp = 1;
    // The ally would keep pushing and shooting the zombie, which can stall
    // its attack for a long time; this is about the leader dying with the
    // ally alive, so keep the ally out of it
    ally.weapons = [undefined, undefined];
    const pin = () => {
      if (leader.isDestroyed) return;
      if (zombie.isDestroyed) zombie = findZombie();
      // Well inside its attack range (0.8 m), not right on the edge of it
      zombie.body.position.set(leader.getPosition().add([0.6, 0]));
      zombie.body.velocity.set(0, 0);
      // Facing the leader, since a pinned zombie keeps its shambling direction
      // and its bite only lands in front of it
      zombie.setTargetDirection(Math.PI);
      zombie.body.angle = Math.PI;
      ally.body.position.set(leader.getPosition().add([-2.5, 0]));
      ally.body.velocity.set(0, 0);
      requestAnimationFrame(pin);
    };
    pin();
    const start = performance.now();
    while (!leader.isDestroyed && performance.now() - start < 15000) {
      await wait(100);
    }
    result.leaderDead = leader.isDestroyed;
    result.allyAliveWhenLeaderDied = !ally.isDestroyed;
    // What they carried is left on the floor
    result.droppedWeapons = [...game.entities.all]
      .filter(
        (e: any) =>
          e.constructor.name === "WeaponPickup" && carried.includes(e.weapon),
      )
      .map((e: any) => [...e.getPosition()] as [number, number]);
    return result;
  });
  expect(death.allyJoined).toBe(true);
  expect(death.leaderDead).toBe(true);
  expect(death.allyAliveWhenLeaderDied).toBe(true);
  // Both weapons drop, a little apart rather than in one pile
  expect(death.droppedWeapons.length).toBe(death.weaponsCarried);
  if (death.droppedWeapons.length === 2) {
    const [[x1, y1], [x2, y2]] = death.droppedWeapons;
    expect(Math.hypot(x1 - x2, y1 - y2)).toBeGreaterThan(0.2);
  }
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
  expect(saved.version).toBe(2);
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
  // Health, ammo and a grenade from the floor machine, then the item and the
  // gun from the store
  expect(run.quartersSpent).toBe(3 + 2 + 4 + firstPrice + gunOffer.price);
  expect(run.items).toEqual([STORE_SHELF.slots[0], gunOffer.name]);
  expect(run.quartersCollected).toBeGreaterThanOrEqual(6);
  expect(run.timeSeconds).toBeGreaterThan(5);
  // Items seen on a shelf count as seen, and saving the run kept the seen flags
  expect(saved.seen.items).toEqual(
    expect.arrayContaining(STORE_SHELF.slots.filter(Boolean)),
  );
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

  // --- Back to the lobby: no title, the elevator just opens, and the last
  // character played is who comes out ---
  await expect(
    page.locator(".menu-button", { hasText: "Back to the lobby" }),
  ).toHaveCount(1);
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => window.DEBUG.game!.entities.getById("lobby"),
    null,
    { timeout: 15000 },
  );
  const back = await page.evaluate(() => {
    const lobby = window.DEBUG.game!.entities.getById("lobby") as any;
    return {
      character: lobby.player.character.name as string,
      doorOpen: lobby.arrivalDoor.openPercentage as number,
    };
  });
  expect(back).toEqual({ character: "Nancy", doorOpen: 0 });
  // What was seen of the lobby before the run was saved, and is back
  const lobbyExplored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("highriseSaveData")!).lobbyExplored as
        string | undefined,
  );
  expect(lobbyExplored?.startsWith("data:image/png")).toBe(true);
  await expect(page.locator(".menu-title")).toHaveCount(0);
  await arriveInLobby(page);
  // Whoever made it out of floor 1 waits in the lobby now
  const rescued = await page.evaluate(
    (name) =>
      window.DEBUG.game!.entities.getTagged("lobby_character").some(
        (c: any) => c.human.character.name === name,
      ),
    stairwell.allyName,
  );
  expect(rescued).toBe(true);
  expectNoIssues(issues);

  // --- The encyclopedia opens from the bookcase, and Escape closes it ---
  await page.evaluate(async () => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    const bookcase = [...game.entities.all].find(
      (e: any) =>
        e.constructor.name === "Interactable" &&
        e.prompt?.(lobby.player).title === "Encyclopedia",
    ) as any;
    lobby.player.body.position.set(bookcase.getPosition().add([-1, 0]));
    lobby.player.body.velocity.set(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  await expect(page.locator(".interact-prompt__title")).toHaveText(
    "Encyclopedia",
  );
  await page.keyboard.press("KeyE");
  await expect(page.locator(".encyclopedia")).toBeVisible();
  // Reading doesn't walk the player around
  const reading = await getLobbyPlayerPosition(page);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyD");
  const stillReading = await getLobbyPlayerPosition(page);
  expect(Math.abs(stillReading[0] - reading[0])).toBeLessThan(0.05);
  await page.keyboard.press("Escape");
  await expect(page.locator(".encyclopedia")).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.DEBUG.game!.paused)).toBe(false);
  await expect(page.locator(".pause-menu__background")).toHaveCount(0);
  expectNoIssues(issues);
});
