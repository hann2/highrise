import { angleDelta, clamp, lerp, mod, smoothStep } from "../util/MathUtil";
import { V, V2d } from "../Vector";

/**
 * How a creature walks: how far its feet reach and how long they stay down,
 * which together set how many steps it takes (with feet that stay put on the
 * ground, the body goes twice the reach while a foot's down). Short reaches
 * and long duties make quick little steps.
 */
export interface GaitStyle {
  /**
   * How far each foot reaches ahead of (and behind) its hip, in meters:
   * `minReach` plus `reachPerSpeed` for each m/s, up to `maxReach`
   */
  minReach: number;
  reachPerSpeed: number;
  maxReach: number;
  /**
   * The share of a step cycle each foot is on the ground, walking slowly
   * (above a half, so one is always down) and at `runSpeed` (under a half:
   * both feet are off the ground for a moment)
   */
  walkDuty: number;
  runDuty: number;
  /** Meters per second at which it's running */
  runSpeed: number;
  /** How high a foot lifts while it swings forward, 0 to 1 */
  lift: number;
}

/** About two steps a second walking, four at 5 m/s, six at 8 m/s */
export const DEFAULT_GAIT: GaitStyle = {
  minReach: 0.2,
  reachPerSpeed: 0.035,
  maxReach: 0.4,
  walkDuty: 0.62,
  runDuty: 0.3,
  runSpeed: 5.5,
  lift: 1,
};

/** Slower than this (m/s), it's standing */
const STANDING_SPEED = 0.25;
/** A move further than this in one tick (meters) is a teleport, not a step */
const TELEPORT_DISTANCE = 1;
/** How fast reach, the direction of travel and the hips catch up (per second) */
const REACH_RESPONSE = 10;
const TRAVEL_RESPONSE = 12;
const HIP_RESPONSE = 8;
/** How much nearer the hips must be to one way along the line of travel before they turn round to face it */
const HIP_HYSTERESIS = 0.35;
/** The most the hips turn from facing (radians): going sideways, the feet step across the way they point */
const MAX_HIP_TWIST = Math.PI / 3;
/** How much shorter steps are going straight sideways */
const SIDESTEP_REACH = 0.65;

/** Where one foot is in its step */
export interface FootStep {
  /** Meters ahead of its hip, in the direction of travel */
  along: number;
  /** How far it's lifted off the ground, 0 to 1 */
  lift: number;
}

/**
 * A walk cycle for a top-down creature with two feet, worked out from how
 * it moves rather than played: it doesn't know what it animates. Each tick
 * `update` takes where the creature is and which way it faces; the cycle
 * moves on by the distance it's gone, so each foot stays put on the ground
 * (moving back under the body exactly as fast as the body goes forward)
 * and then swings forward, lifted, to step again. It stops when the creature
 * does, and pausing or slow motion need nothing done.
 *
 * Angles are in the world. The feet move along the direction of travel;
 * the hips (which way the feet point) turn to the line of travel, but never
 * more than `MAX_HIP_TWIST` from facing, so walking backward steps backward,
 * and walking sideways takes shorter steps across.
 */
export class Gait {
  /** How far through a step cycle the left foot is, 0 to 1: it lands at 0. The right foot is half a cycle on. */
  phase = 0;
  /** Meters each foot reaches from under its hip right now */
  reach = 0;
  /** The share of the cycle each foot is down right now */
  duty: number;
  /** Meters per second, as of the last update */
  speed = 0;
  /** The direction of travel, which the feet step along */
  travelAngle: number;
  /** Which way the hips and feet point */
  hipAngle: number;

  private lastPosition?: V2d;

  constructor(
    public style: GaitStyle = DEFAULT_GAIT,
    facing = 0,
  ) {
    this.duty = style.walkDuty;
    this.travelAngle = facing;
    this.hipAngle = facing;
  }

  update(position: V2d, facing: number, dt: number) {
    const last = this.lastPosition;
    this.lastPosition = position.clone();
    if (dt <= 0) {
      return;
    }
    const moved = last ? position.sub(last) : V(0, 0);
    const distance = moved.magnitude;
    if (distance > TELEPORT_DISTANCE) {
      this.speed = 0;
      return;
    }
    this.speed = distance / dt;
    const { style } = this;
    const moving = this.speed > STANDING_SPEED;

    // Shorter steps going sideways
    const across = moving ? Math.abs(Math.sin(moved.angle - facing)) : 0;
    const targetReach = moving
      ? Math.min(
          style.minReach + this.speed * style.reachPerSpeed,
          style.maxReach,
        ) * lerp(1, SIDESTEP_REACH, across)
      : 0;
    this.reach = approach(this.reach, targetReach, REACH_RESPONSE, dt);
    const running = clamp(this.speed / style.runSpeed);
    this.duty = lerp(style.walkDuty, style.runDuty, running);

    if (moving) {
      this.travelAngle = approachAngle(
        this.travelAngle,
        moved.angle,
        TRAVEL_RESPONSE,
        dt,
      );
      // The cycle's length is the distance the body goes while a foot's down
      const cycleLength = (2 * Math.max(this.reach, 0.02)) / this.duty;
      this.phase = mod(this.phase + distance / cycleLength, 1);
    }

    this.hipAngle = approachAngle(
      this.hipAngle,
      moving ? this.hipTarget(facing) : facing,
      HIP_RESPONSE,
      dt,
    );
    const twist = angleDelta(facing, this.hipAngle);
    if (Math.abs(twist) > MAX_HIP_TWIST) {
      this.hipAngle = facing + Math.sign(twist) * MAX_HIP_TWIST;
    }
  }

  /** The way along the line of travel nearer facing, unless the hips are already nearer the other */
  private hipTarget(facing: number): number {
    const forward = this.travelAngle;
    const backward = forward + Math.PI;
    const fromFacing =
      Math.abs(angleDelta(facing, forward)) -
      Math.abs(angleDelta(facing, backward));
    const fromHips =
      Math.abs(angleDelta(this.hipAngle, forward)) -
      Math.abs(angleDelta(this.hipAngle, backward));
    if (Math.abs(fromFacing) < HIP_HYSTERESIS) {
      return fromHips <= 0 ? forward : backward;
    }
    return fromFacing <= 0 ? forward : backward;
  }

  /** Where a foot is: 0 the left, 1 the right */
  foot(side: 0 | 1): FootStep {
    const u = mod(this.phase + side * 0.5, 1);
    const { duty, reach } = this;
    if (u < duty) {
      // Down: from in front to behind, as fast as the body goes
      return { along: reach * (1 - (2 * u) / duty), lift: 0 };
    }
    // Swinging forward
    const t = (u - duty) / (1 - duty);
    return {
      along: reach * (2 * smoothStep(t) - 1),
      lift: Math.sin(Math.PI * t) * this.style.lift * this.stride,
    };
  }

  /** How big the steps are, 0 (standing) to 1 (the longest it takes) */
  get stride(): number {
    return this.style.maxReach > 0 ? this.reach / this.style.maxReach : 0;
  }
}

/** `value` moved toward `target` by a share that depends on `dt`, the same at any tick rate */
function approach(value: number, target: number, rate: number, dt: number) {
  return lerp(target, value, Math.exp(-rate * dt));
}

function approachAngle(
  angle: number,
  target: number,
  rate: number,
  dt: number,
) {
  return angle + angleDelta(angle, target) * (1 - Math.exp(-rate * dt));
}
