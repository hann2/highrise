import { Sprite, Texture } from "pixi.js";
import { degToRad } from "../../core/util/MathUtil";
import Light from "./Light";
import { LIGHT_RESOLUTION } from "./lightingConstants";

export interface DirectionalLightOptions {
  /** How far the light reaches, in meters */
  length?: number;
  /** Full angle of the cone, in radians */
  spread?: number;
  intensity?: number;
  color?: number;
  shadowsEnabled?: boolean;
  /** Radius of the light source in meters, for soft shadows */
  sourceRadius?: number;
}

/** A cone of light, like a flashlight. Point it with `setDirection`. */
export class DirectionalLight extends Light {
  constructor({
    length = 8,
    spread = degToRad(35),
    intensity = 1.0,
    color = 0xffffff,
    shadowsEnabled = true,
    sourceRadius = 0,
  }: DirectionalLightOptions = {}) {
    const cone = new Sprite(getConeTexture(length, spread));
    cone.anchor.set(0, 0.5);
    cone.width = length;
    cone.height = coneHeight(length, spread);
    cone.blendMode = "add";

    super(cone, shadowsEnabled, length, sourceRadius, length * 2);

    this.setIntensity(intensity);
    this.setColor(color);
  }

  setDirection(angle: number) {
    if (angle !== this.lightSprite.rotation) {
      this.lightSprite.rotation = angle;
      this.dirty = true;
    }
  }
}

/** Height in meters of the rectangle that a cone fits in */
function coneHeight(length: number, spread: number): number {
  return 2 * length * Math.sin(Math.min(spread / 2, Math.PI / 2));
}

const coneTextures = new Map<string, Texture>();

/**
 * A cone of light pointing along +x from the left edge's midpoint, fading
 * out with distance and toward the edges of the cone. Cached per shape, so
 * every flashlight of the same size shares one texture.
 */
function getConeTexture(length: number, spread: number): Texture {
  const key = `${length},${spread}`;
  let texture = coneTextures.get(key);
  if (!texture) {
    const width = Math.ceil(length * LIGHT_RESOLUTION);
    const height = Math.ceil(coneHeight(length, spread) * LIGHT_RESOLUTION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(width, height);
    const halfSpread = spread / 2;
    // Fraction of the half angle over which the edge fades
    const edgeSoftness = 0.3;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = (x + 0.5) / LIGHT_RESOLUTION;
        const py = (y + 0.5) / LIGHT_RESOLUTION - height / LIGHT_RESOLUTION / 2;
        const distance = Math.hypot(px, py);
        const angle = Math.abs(Math.atan2(py, px));
        const radial = Math.max(0, 1 - distance / length);
        const edge = Math.min(
          1,
          Math.max(0, (halfSpread - angle) / (halfSpread * edgeSoftness)),
        );
        const brightness =
          radial * radial * (edge * edge * (3 - 2 * edge)) * 255;
        const i = (y * width + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(brightness);
      }
    }
    ctx.putImageData(image, 0, 0);
    texture = Texture.from(canvas);
    texture.source.scaleMode = "linear";
    coneTextures.set(key, texture);
  }
  return texture;
}
