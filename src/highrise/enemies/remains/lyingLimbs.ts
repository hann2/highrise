import { Container, Sprite } from "pixi.js";
import {
  makeSleeve,
  Sleeve,
  type BodyTextures,
} from "../../creature-stuff/BodySprite";
import {
  ArmPose,
  SLEEVE_BEND,
  sleeveStrip,
} from "../../creature-stuff/sleeveStrip";
import { LimbPose, limbJoints, LyingBody } from "../../looks/lyingPose";
import type { BodyMetrics } from "../../looks/bakeBodies";

/**
 * Limbs lying down, bent at the elbow or knee: each a whole straight
 * picture laid along its joints as a strip of triangles, like a sleeve. A
 * `Corpse` moves them as it falls; pieces that come off (`comeApart`) are
 * laid out once, as they fly.
 */

type Point = ArmPose["shoulder"];

/** How big a body lying face down is, in meters, for `lyingPose`: `size` times a human */
export function lyingBodyOf(metrics: BodyMetrics, size: number): LyingBody {
  return {
    shoulder: metrics.lyingShoulder * size,
    upperArm: metrics.upperArm * size,
    forearm: metrics.forearm * size,
    hipX: (metrics.lyingWaist + metrics.lyingHipDrop) * size,
    hipY: metrics.lyingHip * size,
    thigh: metrics.lyingThigh * size,
    shin: metrics.lyingShin * size,
    headX: metrics.lyingHead * size,
    headRadius: metrics.headRadius * size,
    handRadius: metrics.handSize * size * 0.5,
  };
}

/** Lays a limb's strip along its joints, `upper` and `lower` long unbent */
export function layLimb(
  strip: Sleeve,
  root: Point,
  middle: Point,
  end: Point,
  upper: number,
  lower: number,
  bend: number,
) {
  sleeveStrip(
    strip.picture,
    {
      shoulder: root,
      elbow: middle,
      hand: end,
      upperArm: upper,
      forearm: lower,
      bend,
    },
    strip.along,
    strip.vertices,
  );
  strip.mesh.geometry.getBuffer("aPosition").update();
}

/**
 * Both legs lying face down, posed: the waist at the origin, the feet
 * toward -x, each leg bent at the knee as `legs` has it and its foot turned
 * out at the ankle by `feet`, with the seat over their tops. `size` is how
 * big the body is next to a human, and `scale` meters a pixel of its
 * images. Undefined if it has no legs drawn in parts.
 */
export function posedLegs(
  textures: BodyTextures,
  size: number,
  scale: number,
  legs: [LimbPose, LimbPose],
  feet: [number, number],
): Container | undefined {
  const parts = textures.legParts;
  if (!parts) {
    return undefined;
  }
  const metrics = textures.metrics;
  const thigh = metrics.lyingThigh * size;
  const shin = metrics.lyingShin * size;
  const bend = metrics.lyingLegThickness * size * 0.5;
  const display = new Container();
  for (const side of [-1, 1] as const) {
    const i = side < 0 ? 0 : 1;
    const hip: Point = [
      -metrics.lyingHipDrop * size,
      side * metrics.lyingHip * size,
    ];
    const { middle, end, endAngle } = limbJoints(hip, legs[i], thigh, shin);
    const strip = makeSleeve(
      side < 0 ? parts.left : parts.right,
      scale,
      thigh,
      bend,
    );
    layLimb(strip, hip, middle, end, thigh, shin, bend);
    const shoe = new Sprite(parts.shoe);
    shoe.position.set(end[0], end[1]);
    shoe.rotation = endAngle + feet[i];
    shoe.scale.set(scale, scale * side);
    // A trouser leg over the top of its shoe, a bare one under it
    if (metrics.lyingBareLegs) {
      display.addChild(strip.mesh, shoe);
    } else {
      display.addChild(shoe, strip.mesh);
    }
  }
  const seat = new Sprite(parts.seat);
  seat.scale.set(scale);
  display.addChild(seat);
  return display;
}

/**
 * An arm lying down, bent at the elbow by `bend` (radians, toward its own
 * side with +), from its shoulder at the origin along +x, with its hand
 */
export function bentArm(
  textures: BodyTextures,
  size: number,
  scale: number,
  left: boolean,
  bend: number,
): Container {
  const metrics = textures.metrics;
  const upper = metrics.upperArm * size;
  const lower = metrics.forearm * size;
  const turn = metrics.armThickness * size * SLEEVE_BEND;
  const pose: LimbPose = { angle: 0, bend };
  const { middle, end, endAngle } = limbJoints([0, 0], pose, upper, lower);
  const strip = makeSleeve(
    left ? textures.leftArm : textures.rightArm,
    scale,
    upper,
    turn,
    metrics.armJoint * size,
  );
  layLimb(strip, [0, 0], middle, end, upper, lower, turn);
  const hand = new Sprite(left ? textures.leftHand : textures.rightHand);
  hand.scale.set(scale);
  hand.position.set(end[0], end[1]);
  hand.rotation = endAngle;
  const display = new Container();
  display.addChild(strip.mesh, hand);
  return display;
}
