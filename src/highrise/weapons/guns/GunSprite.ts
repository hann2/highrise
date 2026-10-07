import { Container, Sprite, Texture } from "pixi.js";
import { GunPartName, GunPose } from "./GunPose";
import { GunStats } from "./GunStats";
import { GUN_PIXELS_PER_METER, GunLayer, getGunLayers } from "./gunArt";

/**
 * A gun as it's held: its art's layers, with the moving parts where its pose
 * puts them. In the holder's frame, in meters.
 */
export class GunSprite extends Container {
  private readonly layers: { display: Container; part?: GunPartName }[];
  private rounds?: Rounds;

  constructor(private readonly stats: GunStats) {
    super();
    this.layers = getGunLayers(stats.art).map((layer) => {
      const display = makeLayer(layer);
      if (display instanceof Rounds) {
        this.rounds = display;
      }
      this.addChild(display);
      return { display, part: layer.part };
    });
    if (process.env.NODE_ENV === "development") {
      for (const part of Object.keys(stats.parts ?? {})) {
        if (!this.layers.some((layer) => layer.part === part)) {
          console.warn(`${stats.name}'s art has no "${part}" to move`);
        }
      }
      if (Boolean(this.rounds) !== Boolean(stats.rounds)) {
        console.warn(
          `${stats.name}'s rounds need both a "rounds" group in its art and GunStats.rounds`,
        );
      }
    }
  }

  setPose(pose: GunPose) {
    this.position.copyFrom(pose.position);
    this.rotation = pose.angle;
    // Held left-handed, the art's flipped, moving parts and all
    this.scale.y = pose.mirrored ? -1 : 1;
    if (this.rounds && this.stats.rounds) {
      this.rounds.slide(pose.rounds * this.stats.rounds.travel);
    }
    for (const { display, part } of this.layers) {
      if (!part) {
        continue;
      }
      if (part === "magazine") {
        // Out of the gun, it's drawn in the hand, or nowhere
        display.visible = pose.magazine.place === "gun";
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
      display.pivot.set(
        pivot[0] * GUN_PIXELS_PER_METER,
        pivot[1] * GUN_PIXELS_PER_METER,
      );
      display.position.set(
        pivot[0] + offset[0] * amount,
        pivot[1] + offset[1] * amount,
      );
      display.rotation = (stroke.angle ?? 0) * amount;
      display.scale.set(
        stretch / GUN_PIXELS_PER_METER,
        1 / GUN_PIXELS_PER_METER,
      );
    }
  }
}

/**
 * A gun's magazine out of it, when it's drawn from the gun's art
 * (`MagazineStats` `"art"`): the layers of its `magazine` part, with its
 * rounds slid as they were in the gun. In meters, with `around` at its origin:
 * the magazine point (`GunStats.points`), where a hand holds it, or its
 * middle.
 */
export class MagazineArt extends Container {
  private rounds?: Rounds;

  constructor(
    private readonly stats: GunStats,
    around: "hand" | "middle",
  ) {
    super();
    for (const layer of getGunLayers(stats.art)) {
      if (layer.part === "magazine") {
        const display = makeLayer(layer);
        if (display instanceof Rounds) {
          this.rounds = display;
        }
        this.addChild(display);
      }
    }
    let [x, y] = stats.points.magazine;
    if (around === "middle") {
      const bounds = this.getLocalBounds();
      [x, y] = [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2];
    }
    for (const child of this.children) {
      child.position.set(-x, -y);
    }
  }

  /** Slides its rounds as a gun pose's are (`GunPose.rounds`): 0 full, 1 empty */
  setRounds(slid: number) {
    this.rounds?.slide(slid * (this.stats.rounds?.travel ?? 0));
  }
}

/** A layer of a gun's art, in meters */
function makeLayer(layer: GunLayer): Container {
  const display = layer.roundsWindow
    ? new Rounds(layer)
    : new Sprite(layer.texture);
  display.scale.set(1 / GUN_PIXELS_PER_METER);
  return display;
}

/**
 * The rounds that show in a gun's art, slid along it as it empties and
 * cropped to where they show: a window onto their texture, which is the whole
 * gun's size, with them where they are when it's full. In pixels, from the
 * gun's origin.
 */
class Rounds extends Container {
  private readonly sprite: Sprite;
  /** Pixels from the left of the texture to the gun's origin */
  private readonly gunOrigin: { x: number; y: number };
  /** Where they show, in pixels from the gun's origin */
  private readonly window: readonly [number, number];
  private slid = NaN;

  constructor({ texture, roundsWindow }: GunLayer) {
    super();
    const { source, width, height } = texture;
    this.gunOrigin = {
      x: texture.defaultAnchor!.x * width,
      y: texture.defaultAnchor!.y * height,
    };
    this.window = [
      roundsWindow![0] * GUN_PIXELS_PER_METER,
      roundsWindow![1] * GUN_PIXELS_PER_METER,
    ];
    // Its own, since its frame moves
    this.sprite = new Sprite(
      new Texture({ source, frame: texture.frame.clone(), dynamic: true }),
    );
    this.addChild(this.sprite);
    this.slide(0);
  }

  /** Slides them `meters` along the gun, showing only what's then in the window */
  slide(meters: number) {
    if (meters === this.slid) {
      return;
    }
    this.slid = meters;
    const slide = meters * GUN_PIXELS_PER_METER;
    const { texture } = this.sprite;
    const width = texture.source.width;
    // What of the texture is in the window
    const left = Math.max(0, this.gunOrigin.x + this.window[0] - slide);
    const right = Math.min(width, this.gunOrigin.x + this.window[1] - slide);
    this.sprite.visible = right > left;
    if (!this.sprite.visible) {
      return;
    }
    texture.frame.x = left;
    texture.frame.width = right - left;
    texture.update();
    this.sprite.position.set(
      left - this.gunOrigin.x + slide,
      -this.gunOrigin.y,
    );
  }

  override destroy(options?: Parameters<Container["destroy"]>[0]) {
    const { texture } = this.sprite;
    super.destroy(options);
    // Its own, which the shared source would otherwise hold on to
    texture.destroy(false);
  }
}
