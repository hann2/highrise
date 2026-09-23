import { expect, Page } from "@playwright/test";

/** Collects page errors and console errors so tests can assert there are none. */
export function collectIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      issues.push(`console.error: ${msg.text()}`);
    }
  });
  return issues;
}

/** Loads the game with a fixed seed and waits for the lobby (and its title screen). */
export async function loadGame(page: Page, seed: number) {
  // Skip the tutorial level so we get a normal generated level
  await page.addInitScript(() => {
    window.localStorage.setItem("tutorialComplete", "true");
  });
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(() => window.DEBUG?.game, null, {
    timeout: 60000,
  });
  // The lobby only shows up once preloading is done
  await page.waitForFunction(
    () => window.DEBUG.game!.entities.getById("lobby"),
    null,
    { timeout: 120000 },
  );
}

/** Waits until the lobby's elevator has opened, pressing Enter to get past the title if it's up. */
export async function arriveInLobby(page: Page) {
  const titleShowing = await page.evaluate(() =>
    [...window.DEBUG.game!.entities.all].some(
      (e) => e.constructor.name === "TitleScreen" && !(e as any).inTransition,
    ),
  );
  if (titleShowing) {
    await page.keyboard.press("Enter");
  }
  await page.waitForFunction(
    () => (window.DEBUG.game!.entities.getById("lobby") as any)?.arrived,
    null,
    { timeout: 30000 },
  );
}

/**
 * From the lobby, starts a run as whoever the player is and waits for the
 * first floor to exist: gets out of the elevator, then steps onto the stairs.
 */
export async function startGame(page: Page) {
  await arriveInLobby(page);
  await page.evaluate(() => {
    const game = window.DEBUG.game!;
    const lobby = game.entities.getById("lobby") as any;
    const stairs = [...game.entities.all].find(
      (e) => e.constructor.name === "Exit",
    ) as any;
    lobby.player.body.position.set(stairs.getPosition());
  });
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
}

/** Where the player is in the lobby */
export async function getLobbyPlayerPosition(
  page: Page,
): Promise<[number, number]> {
  return page.evaluate(() => {
    const lobby = window.DEBUG.game!.entities.getById("lobby") as any;
    const [x, y] = lobby.player.body.position;
    return [x, y] as [number, number];
  });
}

export async function getLeaderPosition(page: Page): Promise<[number, number]> {
  return page.evaluate(() => {
    const partyManager = [...window.DEBUG.game!.entities.all].find(
      (e) => e.constructor.name === "PartyManager",
    ) as any;
    const [x, y] = partyManager.leader.body.position;
    return [x, y] as [number, number];
  });
}

export async function getLevelNumber(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (
        [...window.DEBUG.game!.entities.all].find(
          (e) => e.constructor.name === "LevelController",
        ) as any
      ).currentLevel,
  );
}

/**
 * Records where the game loop's CPU time goes for `ms` of play, per section
 * and per entity class, averaged over the window. Format with
 * `JSON.stringify` or look at `label`, `depth` and `msPerFrame`.
 */
export async function captureProfile(page: Page, ms: number) {
  return page.evaluate(async (ms) => {
    const profiler = window.DEBUG.profiler!;
    profiler.entityDetail = true;
    profiler.startCapture();
    await new Promise((resolve) => setTimeout(resolve, ms));
    const report = profiler.stopCapture("Game.nextFrame");
    profiler.entityDetail = false;
    return report;
  }, ms);
}

/** Walks the leader in a square for `ms`, so that lighting and AI have work to do */
export async function wander(page: Page, ms: number) {
  const keys = ["KeyD", "KeyS", "KeyA", "KeyW"];
  const end = Date.now() + ms;
  for (let i = 0; Date.now() < end; i++) {
    const key = keys[i % keys.length];
    await page.keyboard.down(key);
    await page.waitForTimeout(500);
    await page.keyboard.up(key);
  }
}

/**
 * Measures frame intervals and the CPU time spent inside the game loop for
 * `ms`. Frame intervals are only meaningful when vsync is off, which the
 * Playwright config does for benchmarks.
 */
export async function measureFrames(page: Page, ms: number) {
  return page.evaluate(async (measureMs) => {
    const game = window.DEBUG.game!;
    const frameTimes: number[] = [];
    const loopTimes: number[] = [];
    const originalLoop = (game as any).loop;
    (game as any).loop = function (...args: unknown[]) {
      const loopStart = performance.now();
      originalLoop.apply(this, args);
      loopTimes.push(performance.now() - loopStart);
    };
    const startTick = game.ticknumber;
    const start = performance.now();
    let last = start;
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        frameTimes.push(now - last);
        last = now;
        if (now - start < measureMs) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
    (game as any).loop = originalLoop;
    const round = (n: number) => Math.round(n * 100) / 100;
    const summarize = (times: number[]) => {
      times.sort((a, b) => a - b);
      const percentile = (p: number) =>
        times[Math.min(times.length - 1, Math.floor(times.length * p))];
      return {
        mean: round(times.reduce((a, b) => a + b, 0) / times.length),
        p50: round(percentile(0.5)),
        p95: round(percentile(0.95)),
        p99: round(percentile(0.99)),
        max: round(times[times.length - 1]),
      };
    };
    return {
      frames: frameTimes.length,
      ticks: game.ticknumber - startTick,
      loopCpuMs: summarize(loopTimes),
      frameIntervalMs: summarize(frameTimes),
      entities: game.entities.all.size,
      bodies: game.world.bodies.all.size,
    };
  }, ms);
}

export function expectNoIssues(issues: string[]) {
  expect(issues, issues.join("\n")).toHaveLength(0);
}
