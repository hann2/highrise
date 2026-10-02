import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V } from "../../core/Vector";
import { cementFloor } from "../environment/decorations/floorDecorations";
import { OverheadLight } from "../environment/lighting/OverheadLight";
import RepeatingFloor from "../environment/RepeatingFloor";
import Door from "../environment/Door";
import Wall from "../environment/Wall";
import { ArenaLayout } from "./arenaLayouts";

/** Meters between the lights when it's dark */
const LIGHT_SPACING = 10;
const LIGHT_RADIUS = 7;

/** How far a door swings either way from shut, like a floor's (see `doors.ts`) */
const DOOR_SWING = 0.9 * (Math.PI / 2);

/** The arena's floor and walls, for one layout */
export default class ArenaRoom extends BaseEntity implements Entity {
  constructor(layout: ArenaLayout) {
    super();
    const { width, height } = layout;
    this.addChildren(
      new RepeatingFloor(cementFloor, [0, 0], [width, height]),
      new Wall([0, 0], [width, 0]),
      new Wall([0, 0], [0, height]),
      new Wall([width, 0], [width, height]),
      new Wall([0, height], [width, height]),
      ...layout.walls.map(([from, to]) => new Wall(from, to)),
    );
  }
}

/**
 * Overhead lights spread out over the arena, for when it's dark: pools of
 * light with dark between them, the way a floor is
 */
export class ArenaLights extends BaseEntity implements Entity {
  constructor(layout: ArenaLayout) {
    super();
    const { width, height } = layout;
    const columns = Math.max(1, Math.round(width / LIGHT_SPACING));
    const rows = Math.max(1, Math.round(height / LIGHT_SPACING));
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const at = V(
          ((i + 0.5) * width) / columns,
          ((j + 0.5) * height) / rows,
        );
        this.addChild(new OverheadLight(at, { radius: LIGHT_RADIUS }));
      }
    }
  }
}

/** A door in each of a layout's doorways, shut */
export class ArenaDoors extends BaseEntity implements Entity {
  constructor(layout: ArenaLayout) {
    super();
    for (const [from, to] of layout.doorways) {
      const hinge = V(from);
      const across = V(to).sub(hinge);
      this.addChild(
        new Door(
          hinge,
          across.magnitude,
          across.angle,
          -DOOR_SWING,
          DOOR_SWING,
        ),
      );
    }
  }
}
