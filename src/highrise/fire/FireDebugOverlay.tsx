import { BitmapText, Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import ReactEntity from "../../core/ReactEntity";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import "./fireDebug.css";
import { FIRE_CELL_SIZE } from "./fireConstants";
import { getFireGrid } from "./FireGrid";

/** Smoke this dense or more is drawn the hottest color */
const FULL_SCALE = 4;
/** Below this, a cell isn't drawn */
const SHOWN = 0.01;
/** The heatmap's colors, from little smoke to a lot */
const RAMP = [0x1030c0, 0x10b060, 0xe0d020, 0xe02010];
/** Pixels a cell has to be on screen for its number to be drawn */
const NUMBER_MIN_PIXELS = 28;

/**
 * A dev-only look at the fire grid's smoke (` toggles it, see
 * `CheatController`): every cell with smoke as a square colored by how much,
 * with the amount written on it when there's room, the edges smoke can't
 * cross in red, and what's in the cell under the mouse in the corner.
 */
export default class FireDebugOverlay extends ReactEntity implements Entity {
  id = "fireDebugOverlay";
  persistenceLevel = Persistence.Permanent;
  sprite: Container & GameSprite = new Container();
  private graphics = new Graphics();
  /** Separate, since each fill on `graphics` starts a new path */
  private wallGraphics = new Graphics();
  private numbers = new Container();
  private numberPool: BitmapText[] = [];

  constructor() {
    super(() => this.renderContent());
    this.sprite.layerName = Layer.WORLD_OVERLAY;
    this.sprite.addChild(this.graphics, this.wallGraphics, this.numbers);
  }

  @on("render")
  onRender(dt: number) {
    super.onRender(dt);
    const g = this.graphics.clear();
    const walls = this.wallGraphics.clear();
    const grid = getFireGrid(this.game);
    let numberCount = 0;
    if (grid) {
      const smoke = grid.smoke;
      const camera = this.game.camera;
      const view = camera.getWorldViewport();
      const size = FIRE_CELL_SIZE;
      const minColumn = Math.max(0, Math.floor(view.left / size));
      const maxColumn = Math.min(
        grid.columns - 1,
        Math.floor(view.right / size),
      );
      const minRow = Math.max(0, Math.floor(view.top / size));
      const maxRow = Math.min(grid.rows - 1, Math.floor(view.bottom / size));
      const showNumbers = camera.z * size >= NUMBER_MIN_PIXELS;

      for (let row = minRow; row <= maxRow; row++) {
        for (let column = minColumn; column <= maxColumn; column++) {
          const cell = row * grid.columns + column;
          const density = smoke.densityAt(cell);
          const x = column * size;
          const y = row * size;
          if (density >= SHOWN) {
            g.rect(x, y, size, size).fill({
              color: rampColor(density / FULL_SCALE),
              alpha: 0.55,
            });
            if (showNumbers) {
              this.placeNumber(numberCount++, x, y, density);
            }
          }
          // The edges smoke can't cross
          if (column + 1 < grid.columns && smoke.wallAlong(cell * 2)) {
            walls.moveTo(x + size, y).lineTo(x + size, y + size);
          }
          if (row + 1 < grid.rows && smoke.wallAlong(cell * 2 + 1)) {
            walls.moveTo(x, y + size).lineTo(x + size, y + size);
          }
        }
      }
      walls.stroke({ width: 0.05, color: 0xff2020 });

      // The cell under the mouse
      const cell = grid.cellAt(camera.toWorld(this.game.io.mousePosition));
      if (cell >= 0) {
        const [cx, cy] = grid.cellCenter(cell);
        g.rect(cx - size / 2, cy - size / 2, size, size).stroke({
          width: 0.05,
          color: 0xffffff,
        });
      }
    }
    for (let i = numberCount; i < this.numberPool.length; i++) {
      this.numberPool[i].visible = false;
    }
  }

  private placeNumber(index: number, x: number, y: number, value: number) {
    let text = this.numberPool[index];
    if (!text) {
      text = new BitmapText({
        text: "",
        style: { fontFamily: "monospace", fontSize: 32, fill: 0xffffff },
      });
      text.anchor.set(0.5);
      text.scale.set(0.005);
      this.numberPool.push(text);
      this.numbers.addChild(text);
    }
    text.visible = true;
    text.text = value < 10 ? value.toFixed(2) : value.toFixed(1);
    text.position.set(x + FIRE_CELL_SIZE / 2, y + FIRE_CELL_SIZE / 2);
  }

  renderContent() {
    const grid = this.isAdded ? getFireGrid(this.game) : undefined;
    if (!grid) {
      return <div className="fire-debug">No fire grid here</div>;
    }
    const position = this.game.camera.toWorld(this.game.io.mousePosition);
    const cell = grid.cellAt(position);
    if (cell < 0) {
      return <div className="fire-debug">Outside the grid</div>;
    }
    const column = cell % grid.columns;
    const row = Math.floor(cell / grid.columns);
    return (
      <div className="fire-debug">
        <div className="fire-debug__title">
          Cell {column}, {row}
        </div>
        <div>Smoke: {grid.smoke.densityAt(cell).toFixed(3)}</div>
        <div>Fuel: {grid.fuelInCell(cell).toFixed(2)} s</div>
        <div>Heat: {grid.cellHeat(cell).toFixed(2)}</div>
        <div>Scorch: {grid.scorchAt(cell).toFixed(2)}</div>
        <div>Smoky cells: {grid.smoke.activeCount}</div>
      </div>
    );
  }
}

/** A color from the heatmap ramp, for `t` from 0 to 1 */
function rampColor(t: number): number {
  const scaled = clamp(t) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(scaled));
  return colorLerp(RAMP[i], RAMP[i + 1], scaled - i);
}
