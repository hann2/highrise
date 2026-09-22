import { Text } from "pixi.js";
import { LayerName } from "../../config/layers";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { GameSprite } from "../entity/GameSprite";
import { on } from "../entity/handler";
import { profiler, ProfileStats } from "./Profiler";

const FRAME_SCOPE = "Game.nextFrame";
const MAX_ROWS = 45;
const MAX_CHILDREN_PER_PARENT = 6;
/** Re-laying out a big Text every frame would show up in its own numbers */
const FRAMES_PER_UPDATE = 10;

/**
 * Draws the profiler's per-frame CPU breakdown on screen as a tree. While
 * visible it turns on per-entity-class timing (see Profiler.entityDetail).
 */
export default class ProfilerOverlay extends BaseEntity implements Entity {
  persistenceLevel = 100;
  pausable = false;
  sprite: Text & GameSprite;
  private framesSinceUpdate = 0;

  constructor(layerName?: LayerName) {
    super();
    this.sprite = new Text({
      text: "",
      style: {
        fontSize: 11,
        fontFamily: "Menlo, Consolas, monospace",
        fill: "white",
        stroke: { color: "black", width: 3 },
        lineHeight: 13,
      },
    });
    this.sprite.layerName = layerName;
    this.sprite.position.set(4, 20);
    this.setVisible(false);
  }

  get visible() {
    return this.sprite.visible;
  }

  setVisible(visible: boolean) {
    this.sprite.visible = visible;
    profiler.entityDetail = visible;
    if (visible) {
      this.framesSinceUpdate = FRAMES_PER_UPDATE;
    }
  }

  @on("render")
  onRender() {
    if (!this.sprite.visible) {
      return;
    }
    if (++this.framesSinceUpdate < FRAMES_PER_UPDATE) {
      return;
    }
    this.framesSinceUpdate = 0;
    this.sprite.text = formatStats(
      profiler.getTopStats(MAX_ROWS, MAX_CHILDREN_PER_PARENT, FRAME_SCOPE),
    );
  }
}

function formatStats(stats: ProfileStats[]): string {
  const frameMs = stats.find((s) => s.depth === 0)?.msPerFrame ?? 0;
  const lines = [
    "ms/frame   %  calls   max  section".padEnd(40),
    ...stats.map((stat) => {
      const percent = frameMs > 0 ? (100 * stat.msPerFrame) / frameMs : 0;
      return (
        stat.msPerFrame.toFixed(2).padStart(8) +
        percent.toFixed(0).padStart(4) +
        stat.callsPerFrame.toFixed(0).padStart(7) +
        stat.maxMs.toFixed(1).padStart(6) +
        "  " +
        "  ".repeat(stat.depth) +
        stat.shortLabel
      );
    }),
  ];
  return lines.join("\n");
}
