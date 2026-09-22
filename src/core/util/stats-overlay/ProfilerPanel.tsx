import { SpatialHashingBroadphase } from "../../physics/collision/broadphase/SpatialHashingBroadphase";
import { profiler } from "../Profiler";
import { ProfileRow } from "./ProfileRow";
import type { StatsPanel, StatsPanelContext } from "./StatsPanel";

const FRAME_SCOPE = "Game.nextFrame";
const TOP_N_PROFILES = 200;
const TOP_N_CHILDREN = 6;

declare global {
  interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  interface Performance {
    /** Non-standard (Chrome-only) memory info. */
    memory?: PerformanceMemory;
  }
}

/**
 * Creates a profiler panel with the per-frame CPU breakdown as a tree. While
 * visible it turns on per-entity-class timing (see Profiler.entityDetail).
 */
export function createProfilerPanel(): StatsPanel {
  let profilingEnabled = true;

  return {
    id: "profiler",

    onShow: () => {
      profiler.entityDetail = true;
    },

    onHide: () => {
      profiler.entityDetail = false;
    },

    render: (ctx) => {
      const profileStats = profiler.getTopStats(
        TOP_N_PROFILES,
        TOP_N_CHILDREN,
        FRAME_SCOPE,
      );
      const basicStats = getBasicStats(ctx);

      // Find frame total for bar width calculations
      const frameStat = profileStats.find(
        (s) => s.label === FRAME_SCOPE && s.depth === 0,
      );
      const frameTotalMs = frameStat?.msPerFrame ?? 1000 / 120;

      return (
        <>
          <div className="stats-overlay__subheader">
            Entities: {basicStats.entityCount} | Bodies: {basicStats.bodyCount}
          </div>

          <div className="stats-overlay__subheader">
            Bodies: {basicStats.kinematicBodyCount}K /{" "}
            {basicStats.particleBodyCount}P / {basicStats.dynamicBodyCount}D /{" "}
            {basicStats.hugeBodyCount}H | Collisions: {basicStats.collisions}
          </div>

          <div className="stats-overlay__subheader">
            Memory: {formatMb(performance.memory?.usedJSHeapSize)} /{" "}
            {formatMb(performance.memory?.totalJSHeapSize)} /{" "}
            {formatMb(performance.memory?.jsHeapSizeLimit)} MB
          </div>

          <div className="stats-overlay__section">
            <div className="stats-overlay__section-header">
              <span className="stats-overlay__section-title">Profiler</span>
              <span className="stats-overlay__hint">
                [R] Reset | [P] {profilingEnabled ? "On" : "Off"}
              </span>
            </div>

            {profileStats.map((stat) => (
              <ProfileRow
                key={stat.label}
                stat={stat}
                frameTotalMs={frameTotalMs}
              />
            ))}

            {profileStats.length === 0 && (
              <div className="stats-overlay__empty">No profile data yet</div>
            )}
          </div>
        </>
      );
    },

    onKeyDown: (_ctx, key) => {
      if (key === "KeyR") {
        profiler.reset();
        return true;
      }
      if (key === "KeyP") {
        profilingEnabled = !profilingEnabled;
        profiler.setEnabled(profilingEnabled);
        return true;
      }
      return false;
    },
  };
}

function formatMb(bytes: number | undefined): string {
  return bytes == null ? "N/A" : (bytes / 1e6).toFixed(0);
}

function getBasicStats(ctx: StatsPanelContext) {
  const world = ctx.game.world;
  const broadphase = world.broadphase;
  const spatialHash =
    broadphase instanceof SpatialHashingBroadphase ? broadphase : undefined;
  return {
    entityCount: ctx.game.entities.all.size,
    bodyCount: world.bodies.length,
    hugeBodyCount: spatialHash?.hugeBodies.size ?? 0,
    dynamicBodyCount: world.bodies.dynamic.length,
    kinematicBodyCount: world.bodies.kinematic.length,
    particleBodyCount: spatialHash?.pointShapeBodies.size ?? 0,
    collisions: spatialHash?.debugData.numCollisions ?? 0,
  };
}
