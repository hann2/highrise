import { expect, Page, test } from "@playwright/test";
import { collectIssues } from "./helpers";

// The arena scene (?scene=arena): a loadout and a wave from the URL, the
// setup panel, and the player coming back after dying

const URL =
  "/?scene=arena&seed=1&char=chad&weapons=spas12,axe&items=buckshotbounce*2,choke" +
  "&throwable=molotov*3&usable=stimpack&act=3&wave=zombie*3,heavy,spitter&layout=pillars";

function arena(page: Page) {
  return page.evaluate(() => {
    const game = window.DEBUG.game!;
    const scene = game.entities.getById("arenaScene") as any;
    const player = scene.player;
    return {
      character: player.character.name as string,
      weapons: player.weapons.map((w: any) => w?.stats.name ?? null),
      items: player.items.map((i: any) => i.name) as string[],
      throwable: `${player.consumable?.name} x${player.consumableCount}`,
      usable: player.usable?.stats.name as string | undefined,
      playerDestroyed: player.isDestroyed as boolean,
      zombieHp: (game.entities.getTagged("zombie") as any[]).map((e) => e.hp),
      wave: scene.wave,
      paused: game.paused,
      search: location.search,
    };
  });
}

test("arena", async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(URL);
  await page.waitForFunction(
    () => window.DEBUG?.game?.entities.getById("arenaScene"),
    null,
    { timeout: 120000 },
  );

  let state = await arena(page);
  expect(state.character).toBe("Chad");
  expect(state.weapons).toEqual(["SPAS12", "Axe"]);
  expect(state.items).toEqual(["Buckshot Bounce", "Buckshot Bounce", "Choke"]);
  expect(state.throwable).toBe("Molotov x3");
  expect(state.usable).toBe("Stim Pack");

  // Enter sends the wave, as tough as act 3
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  state = await arena(page);
  expect(state.wave.size).toBe(5);
  // Zombies and the spitter have 100 HP in act 1
  expect(state.zombieHp).toEqual([150, 150, 150, 150]);

  // Backspace clears them away
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(200);
  expect((await arena(page)).zombieHp).toEqual([]);

  // The panel pauses, and applying it changes the player and the URL
  await page.keyboard.press("Tab");
  await page.waitForSelector(".arena-panel");
  expect((await arena(page)).paused).toBe(true);
  await page.selectOption(".arena-panel select >> nth=0", { label: "Cindy" });
  await page.click(".arena-panel button:has-text('corridor')");
  await page.click(".arena-toggle:has-text('dummies')");
  await page.keyboard.press("Tab");
  state = await arena(page);
  expect(state.paused).toBe(false);
  expect(state.character).toBe("Cindy");
  expect(state.search).toContain("char=cindy");
  expect(state.search).toContain("layout=corridor");
  expect(state.search).toContain("dummies");
  expect(state.search).toContain("seed=1");

  // Dying brings the player back with the loadout
  await page.evaluate(() => {
    (
      window.DEBUG.game!.entities.getById("arenaScene") as any
    ).player.inflictDamage(1e4);
  });
  await page.waitForTimeout(300);
  expect((await arena(page)).playerDestroyed).toBe(true);
  await page.waitForTimeout(1800);
  state = await arena(page);
  expect(state.playerDestroyed).toBe(false);
  expect(state.weapons).toEqual(["SPAS12", "Axe"]);

  // Reloading keeps the setup
  await page.reload();
  await page.waitForFunction(
    () => window.DEBUG?.game?.entities.getById("arenaScene"),
    null,
    { timeout: 120000 },
  );
  expect((await arena(page)).character).toBe("Cindy");

  expect(issues).toEqual([]);
});
