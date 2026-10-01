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

/**
 * Loads the game with a fixed seed and waits for the title screen. Unless
 * `tutorial` is set, the tutorial counts as played, so the title goes
 * straight to the lobby.
 */
export async function loadGame(
  page: Page,
  seed: number,
  { tutorial = false, fps }: { tutorial?: boolean; fps?: number } = {},
) {
  if (!tutorial) {
    await page.addInitScript(() => {
      window.localStorage.setItem("tutorialComplete", "true");
    });
  }
  await page.goto(`/?seed=${seed}${fps ? `&fps=${fps}` : ""}`);
  await page.waitForFunction(() => window.DEBUG?.game, null, {
    timeout: 60000,
  });
  // The title only shows up once preloading is done
  await page.waitForFunction(
    () =>
      [...window.DEBUG.game!.entities.all].some(
        (e) => e.constructor.name === "TitleScreen",
      ),
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
 * (tick and render are split by tick layer) and, with `entityDetail` (the
 * default), per entity class, averaged over the window. Timing each entity
 * costs a little per call, which adds up with hundreds of entities, so for
 * accurate totals capture without it. Format with `JSON.stringify` or look at
 * `label`, `depth` and `msPerFrame`.
 *
 * `gpu` is the GPU's side, from `GpuProfiler`, in GPU ms per frame: just the
 * whole render (`Game.render`), unless `gpuDetail` (which defaults to
 * `entityDetail`), with which it's also split into sections (tick layers,
 * the stage, the lighting's passes). Splitting adds to the totals the way
 * entity detail does (see `GpuProfiler`), so take totals from a capture
 * without it. `gpu.available` is false where WebGL can't time the GPU.
 */
export async function captureProfile(
  page: Page,
  ms: number,
  {
    entityDetail = true,
    gpuDetail = entityDetail,
  }: { entityDetail?: boolean; gpuDetail?: boolean } = {},
) {
  return page.evaluate(
    async ([ms, entityDetail, gpuDetail]) => {
      const profiler = window.DEBUG.profiler!;
      const gpuProfiler = window.DEBUG.gpuProfiler!;
      profiler.entityDetail = entityDetail;
      profiler.startCapture();
      gpuProfiler.maxDepth = gpuDetail ? Infinity : 1;
      gpuProfiler.startCapture();
      await new Promise((resolve) => setTimeout(resolve, ms));
      const report = profiler.stopCapture("Game.nextFrame");
      const gpu = gpuProfiler.stopCapture();
      gpuProfiler.enabled = false;
      profiler.entityDetail = false;
      return { ...report, gpu };
    },
    [ms, entityDetail, gpuDetail] as const,
  );
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
 * Measures the intervals between the frames the game runs (ticks and a
 * render), and the CPU time each takes, for `ms`. Benchmarks run without vsync
 * and pin the frame rate with `?fps=120`, so the game runs at 120 fps when it
 * keeps up, and the intervals get longer when it doesn't.
 */
export async function measureFrames(page: Page, ms: number) {
  return page.evaluate(async (measureMs) => {
    const game = window.DEBUG.game!;
    const frameTimes: number[] = [];
    const loopTimes: number[] = [];
    const originalNextFrame = (game as any).nextFrame;
    let last: number | undefined;
    (game as any).nextFrame = function (...args: unknown[]) {
      const frameStart = performance.now();
      if (last !== undefined) {
        frameTimes.push(frameStart - last);
      }
      last = frameStart;
      originalNextFrame.apply(this, args);
      loopTimes.push(performance.now() - frameStart);
    };
    const startTick = game.ticknumber;
    await new Promise((resolve) => setTimeout(resolve, measureMs));
    delete (game as any).nextFrame;
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
