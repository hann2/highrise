import { makeRandom } from "../../core/util/Random";
import { BodyLook } from "./BodyLook";
import { Color, darken, mix, saturate } from "./color";

/**
 * A look's build slider settings turned into sizes, in millimeters, for a
 * body the size of a human (`HUMAN_RADIUS`); bigger and smaller bodies are
 * drawn the same and scaled.
 */
export interface BodyDimensions {
  /** From the middle to the outside of each shoulder */
  shoulderHalfWidth: number;
  /** How far the chest comes forward of the middle, and the back behind it */
  chestDepth: number;
  backDepth: number;
  belly: number;
  /** How far forward the ends of the shoulders are */
  hunch: number;
  /** The exponent of the superellipse the torso is: 2 round, 4 square */
  squareness: number;
  armThickness: number;
  /** The length the arm is drawn at; it's stretched from shoulder to hand */
  armLength: number;
  handSize: number;
  /** The skull's half-length front to back, and half-width */
  headRx: number;
  headRy: number;
  /** A leg's thickness, and the length it's drawn at (it's stretched from hip to ankle) */
  legThickness: number;
  legLength: number;
}

export function bodyDimensions(look: BodyLook): BodyDimensions {
  const b = look.build;
  const headScale = 1 + 0.12 * b.head;
  return {
    shoulderHalfWidth: 312 * (1 + 0.14 * b.shoulders + 0.04 * b.arms),
    chestDepth: 118 * (1 + 0.28 * b.chest),
    backDepth: 104 * (1 + 0.12 * b.chest),
    belly: Math.max(0, b.belly) * 115,
    hunch: b.hunch * 55,
    squareness: 2.2 + 1.3 * (b.squareness + 1),
    armThickness: 104 * (1 + 0.26 * b.arms),
    armLength: 420,
    handSize: 112 * (1 + 0.2 * b.hands),
    headRx: 150 * headScale,
    headRy: 136 * headScale,
    legThickness: 160 * (1 + 0.22 * b.legs),
    legLength: 480,
  };
}

/** The colors that change as a zombie rots */
export interface Palette {
  skin: Color;
  hair: Color;
}

const ROT_SKIN = "#86a06c";
const ROT_GREY = "#8c938a";

export function palette(look: BodyLook): Palette {
  const rot = look.zombie?.rot ?? 0;
  if (rot <= 0) {
    return { skin: look.skin, hair: look.hair.color };
  }
  // Greener, then greyer, and keeping some of how dark the skin was
  const sickly = mix(
    look.skin,
    mix(ROT_SKIN, ROT_GREY, rot * 0.5),
    0.45 + rot * 0.4,
  );
  return {
    skin: saturate(sickly, 1 - rot * 0.25),
    hair: saturate(darken(look.hair.color, rot * 0.1), 1 - rot * 0.4),
  };
}

/** A random number generator just for this look, and this part of it */
export function lookRandom(look: BodyLook, salt: number): () => number {
  return makeRandom(look.seed * 7919 + salt * 104729);
}

/**
 * A wobble round a circle: a sum of a few slow waves with random phases,
 * between about -1 and 1
 */
export function wobble(
  random: () => number,
  waves = 5,
  lowest = 2,
): (angle: number) => number {
  const terms = Array.from({ length: waves }, (_, i) => ({
    frequency: lowest + i + Math.floor(random() * 3),
    phase: random() * Math.PI * 2,
    amplitude: 1 / (1 + i * 0.6),
  }));
  const total = terms.reduce((sum, t) => sum + t.amplitude, 0);
  return (angle) =>
    terms.reduce(
      (sum, t) => sum + t.amplitude * Math.sin(t.frequency * angle + t.phase),
      0,
    ) / total;
}
