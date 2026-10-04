import { Geometry, GlProgram, Mesh, Shader } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { makeRandom } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { PointLight } from "../lighting-and-vision/PointLight";
import { getSetting } from "../settings/SettingsController";
import {
  DEFAULT_FLASH,
  MuzzleFlashStyle,
  Spread,
} from "../weapons/guns/MuzzleFlashStyle";
import frag_muzzleFlash from "./muzzleFlash.frag?raw";
import vert_muzzleFlash from "./muzzleFlash.vert?raw";

/** As many lobes as the shader takes */
const MAX_LOBES = 8;
/**
 * Every flash's lobes are this much longer and wider than their styles say:
 * bigger than life, so they read at the game's zoom
 */
const SCALE = 1.6;
/** Room around the lobes for the noise to push them into, in meters */
const MARGIN = 0.12 * SCALE;

/** Only looks, so it has its own random numbers and never disturbs the seeded ones */
const random = makeRandom(Date.now());

function pick(spread: Spread): number {
  return typeof spread === "number"
    ? spread
    : spread[0] + random() * (spread[1] - spread[0]);
}

/**
 * A muzzle flash, drawn by a shader (`muzzleFlash.frag`) from the lobes of
 * its gun's `MuzzleFlashStyle`, each picked from its ranges, so every flash
 * is a shape of its own; plus a light that fades with it.
 */
export default class MuzzleFlash extends BaseEntity implements Entity {
  tickLayer = "effects" as const;
  sprite: Mesh<Geometry, Shader> & GameSprite;
  light?: PointLight;
  /** Seconds since it went off */
  age = 0;
  /** Seconds it lasts */
  readonly duration: number;
  private shader: Shader;

  /**
   * `frozenAt` holds it at that fraction of its life forever, for looking at
   * (the flash test scene's gallery)
   */
  constructor(
    position: V2d,
    angle: number,
    private style: MuzzleFlashStyle = DEFAULT_FLASH,
    private frozenAt?: number,
  ) {
    super();
    this.duration = pick(style.duration);

    const lobeA = new Float32Array(4 * MAX_LOBES);
    const lobeB = new Float32Array(4 * MAX_LOBES);
    let count = 0;
    let [left, top, right, bottom] = [0, 0, 0, 0];
    for (const lobe of style.lobes) {
      if (count >= MAX_LOBES) {
        break;
      }
      if (lobe.chance !== undefined && random() >= lobe.chance) {
        continue;
      }
      const [ox, oy] = lobe.origin ?? [0, 0];
      const direction = pick(lobe.angle);
      const length = pick(lobe.length) * SCALE;
      const width = pick(lobe.width) * SCALE;
      const dx = Math.cos(direction);
      const dy = Math.sin(direction);
      lobeA.set([ox, oy, dx, dy], count * 4);
      lobeB.set([length, width, pick(lobe.heat ?? 1), 0], count * 4);
      count++;
      // What it covers, as it'll be at its longest
      const reach = length * 1.2;
      const tipX = ox + dx * reach;
      const tipY = oy + dy * reach;
      left = Math.min(left, ox - width, tipX - width);
      right = Math.max(right, ox + width, tipX + width);
      top = Math.min(top, oy - width, tipY - width);
      bottom = Math.max(bottom, oy + width, tipY + width);
    }
    left -= MARGIN;
    top -= MARGIN;
    right += MARGIN;
    bottom += MARGIN;

    this.shader = new Shader({
      glProgram: GlProgram.from({
        vertex: vert_muzzleFlash,
        fragment: frag_muzzleFlash,
        name: "muzzleFlash",
      }),
      resources: {
        flashUniforms: {
          uLobeA: { value: lobeA, type: "vec4<f32>", size: MAX_LOBES },
          uLobeB: { value: lobeB, type: "vec4<f32>", size: MAX_LOBES },
          uLobeCount: { value: count, type: "f32" },
          uAge: { value: frozenAt ?? 0, type: "f32" },
          uTime: { value: (frozenAt ?? 0) * this.duration, type: "f32" },
          uSeed: { value: random() * 100, type: "f32" },
          uTurbulence: { value: style.turbulence, type: "f32" },
          uTemperature: { value: style.temperature, type: "f32" },
        },
      },
    });
    this.sprite = new Mesh({
      geometry: new Geometry({
        attributes: {
          aPosition: [left, top, right, top, right, bottom, left, bottom],
        },
        indexBuffer: [0, 1, 2, 0, 2, 3],
      }),
      shader: this.shader,
    });
    this.sprite.blendMode = "add";
    this.sprite.layerName = Layer.EMISSIVES;
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = angle + (random() * 2 - 1) * (style.wobble ?? 0);
  }

  @on("add")
  onAdd() {
    if (!getSetting(this.game, "gunfireLights")) {
      return;
    }
    const { light } = this.style;
    this.light = this.addChild(
      new PointLight({
        radius: light.radius,
        intensity: light.intensity * this.brightness(),
        color: light.color,
        shadowsEnabled: true,
        softShadows: true,
        position: this.getPosition(),
      }),
    );
  }

  /** How bright the light is, 0 to 1, from how far through its life it is */
  private brightness(): number {
    const t = this.frozenAt ?? Math.min(this.age / this.duration, 1);
    return (1 - t) ** 1.5;
  }

  @on("tick")
  onTick(dt: number) {
    if (this.frozenAt !== undefined) {
      return;
    }
    if (this.age >= this.duration) {
      this.destroy();
      return;
    }
    // Shown as it is now, then moved on, so its first frame is it going off
    const uniforms = this.shader.resources.flashUniforms.uniforms;
    uniforms.uAge = this.age / this.duration;
    uniforms.uTime = this.age;
    this.light?.setIntensity(this.style.light.intensity * this.brightness());
    this.age += dt;
  }
}
