import { Container, Sprite } from "pixi.js";
import { GunPartName, GunPose } from "./GunPose";
import { GunStats } from "./GunStats";
import { GUN_PIXELS_PER_METER, getGunLayers } from "./gunArt";

/**
 * A gun as it's held: its art's layers, with the moving parts where its pose
 * puts them. In the holder's frame, in meters.
 */
export class GunSprite extends Container {
  private readonly layers: { sprite: Sprite; part?: GunPartName }[];

  constructor(private readonly stats: GunStats) {
    super();
    this.layers = getGunLayers(stats.art).map(({ texture, part }) => {
      const sprite = new Sprite(texture);
      sprite.scale.set(1 / GUN_PIXELS_PER_METER);
      this.addChild(sprite);
      return { sprite, part };
    });
    if (process.env.NODE_ENV === "development") {
      for (const part of Object.keys(stats.parts ?? {})) {
        if (!this.layers.some((layer) => layer.part === part)) {
          console.warn(`${stats.name}'s art has no "${part}" to move`);
        }
      }
    }
  }

  setPose(pose: GunPose) {
    this.position.copyFrom(pose.position);
    this.rotation = pose.angle;
    // Held left-handed, the art's flipped, moving parts and all
    this.scale.y = pose.mirrored ? -1 : 1;
    for (const { sprite, part } of this.layers) {
      if (!part) {
        continue;
      }
      if (part === "magazine") {
        // Out of the gun, it's drawn in the hand, or nowhere
        sprite.visible = pose.magazine.place === "gun";
      }
      const stroke = this.stats.parts?.[part];
      const amount = pose.parts[part] ?? 0;
      if (!stroke) {
        continue;
      }
      // Moved, turned and shortened about its pivot
      const pivot = stroke.pivot ?? [0, 0];
      const offset = stroke.offset ?? [0, 0];
      const stretch = 1 + ((stroke.stretch ?? 1) - 1) * amount;
      sprite.pivot.set(
        pivot[0] * GUN_PIXELS_PER_METER,
        pivot[1] * GUN_PIXELS_PER_METER,
      );
      sprite.position.set(
        pivot[0] + offset[0] * amount,
        pivot[1] + offset[1] * amount,
      );
      sprite.rotation = (stroke.angle ?? 0) * amount;
      sprite.scale.set(
        stretch / GUN_PIXELS_PER_METER,
        1 / GUN_PIXELS_PER_METER,
      );
    }
  }
}
