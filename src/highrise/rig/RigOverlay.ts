import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import { GunPointName, muzzleOf, pointOnGun } from "../weapons/guns/GunPose";

/** The colors of the points on a gun */
export const POINT_COLORS: Record<GunPointName | "muzzle", number> = {
  grip: 0xff3030,
  foregrip: 0x3080ff,
  magazine: 0xffd020,
  action: 0x30e060,
  muzzle: 0xffffff,
};

const RADIUS = 0.018; // meters

/**
 * Marks the points on each human's gun (`GunStats.points`, and the muzzle)
 * where the gun is right now, and rings where the hands are, for seeing
 * where things are while making animations
 */
export default class RigOverlay extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(private humans: () => Human[]) {
    super();
    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_OVERLAY;
  }

  @on("render")
  onRender() {
    const g = this.sprite.clear();
    for (const human of this.humans()) {
      const gun = human.weapon;
      if (!(gun instanceof Gun)) {
        continue;
      }
      const pose = gun.getPose();
      const toWorld = (local: [number, number] | ReturnType<typeof muzzleOf>) =>
        human.localToWorld(local);
      for (const name of Object.keys(gun.stats.points) as GunPointName[]) {
        const at = toWorld(pointOnGun(pose, gun.stats.points[name]));
        g.circle(at.x, at.y, RADIUS).fill(POINT_COLORS[name]);
      }
      const muzzle = toWorld(muzzleOf(gun.stats, pose));
      g.circle(muzzle.x, muzzle.y, RADIUS * 0.7).fill(POINT_COLORS.muzzle);
      for (const hand of [pose.leftHand, pose.rightHand]) {
        const at = toWorld(hand);
        g.circle(at.x, at.y, RADIUS * 2).stroke({
          width: RADIUS / 3,
          color: 0xffffff,
        });
      }
    }
  }
}
