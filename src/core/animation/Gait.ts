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
/** A move further than this between updates (meters) is a teleport, not a step */
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
/** The left foot and the right, to loop over */
export const SIDES = [0, 1] as const;
/**
 * Standing, a foot further than this from under its hip (meters), or turned
 * further than `SETTLE_TURN` from the hips, takes a step back under it, in
 * `SETTLE_TIME` seconds, lifted `SETTLE_LIFT` of a full step's height
 */
const SETTLE_DISTANCE = 0.05;
const SETTLE_TURN = 0.6;
/** Once settling has started, it goes on until both feet are this square under the hips: meters, radians */
const SQUARE_DISTANCE = 0.03;
const SQUARE_TURN = 0.15;
const SETTLE_TIME = 0.18;
const SETTLE_LIFT = 0.35;
/** A foot left further than this many of the longest reaches from its hip (by a shove, say) steps to catch up */
const MAX_STRETCH = 2.5;

/** One foot: where its ankle is on the floor, which way it points, and whether it's down */
export interface Foot {
  /** Where the ankle is, in the world */
  x: number;
  y: number;
  /** Which way the foot points */
  angle: number;
  /** On the ground, where it stays until it lifts */
  planted: boolean;
  /** How far it's lifted off the ground, 0 to 1 */
  lift: number;
}

/** A foot coming down on the floor: for footprints and footsteps */
export interface FootLanding {
  /** 0 the left foot, 1 the right */
  side: 0 | 1;
  /** Where the ankle landed, in the world */
  position: V2d;
  /** Which way the foot points */
  angle: number;
  /** How fast the body was going (m/s) */
  speed: number;
  /** A small step to stand square (stopping, or turning on the spot) rather than a stride */
  settling: boolean;
}

/** A foot in the air: where it took off from, and how far through its swing it is */
interface Swing {
  fromX: number;
  fromY: number;
  fromAngle: number;
  /** 0 to 1 */
  t: number;
  /** Moved on by time (seconds) rather than by the step cycle: a settling or catch-up step */
  duration?: number;
}

/**
 * A walk cycle for a top-down creature with two feet, worked out from how
 * it moves rather than played: it doesn't know what it animates. Each
 * `update` takes where the creature is and which way it faces.
 *
 * Each foot has a place on the floor. A foot that's down stays exactly
 * where it is, however the body speeds up, slows down or turns, until the
 * step cycle lifts it; then it swings to where its hip will be when it lands,
 * plus its reach, and comes down there (`onLand`). The cycle (`phase`) moves
 * on by the distance the body goes, so the steps keep pace with it, and
 * pausing or slow motion need nothing done. Standing still, feet that aren't
 * under their hips step back under them, one at a time, which is also how
 * it turns on the spot.
 *
 * Angles are in the world. The feet step along the direction of travel;
 * the hips (which way the feet point) turn to the line of travel, but never
 * more than `MAX_HIP_TWIST` from facing, so walking backward steps backward,
 * and walking sideways takes shorter steps across.
 */
export class Gait {
  /** How far through a step cycle the left foot is, 0 to 1: it lifts at `duty` and lands at 1. The right foot is half a cycle on. */
  phase = 0;
  /** Meters each foot reaches from under its hip right now */
  reach = 0;
  /** The share of the cycle each foot is down right now */
  duty: number;
  /** Meters per second, as of the last update */
  speed = 0;
  /** The direction of travel, which the feet step along */
  travelAngle: number;
  /** Which way the hips point, and the feet when they land */
  hipAngle: number;
  /** The left foot and the right */
  readonly feet: [Foot, Foot];
  /** Called as each foot comes down */
  onLand?: (landing: FootLanding) => void;

  private swings: [Swing | undefined, Swing | undefined] = [
    undefined,
    undefined,
  ];
  private moving = false;
  /** Standing, and stepping the feet square under the hips */
  private settling = false;
  private x = NaN;
  /** The left hip from the middle (the right is the other way) */
  private hipOffsetX = 0;
  private hipOffsetY = 0;
  private y = NaN;

  /** `hipWidth` is the meters from the middle of the body to each hip */
  constructor(
    public style: GaitStyle = DEFAULT_GAIT,
    public hipWidth = 0.1,
    facing = 0,
  ) {
    this.duty = style.walkDuty;
    this.travelAngle = facing;
    this.hipAngle = facing;
    this.placeHips();
    const foot = (): Foot => ({
      x: 0,
      y: 0,
      angle: facing,
      planted: true,
      lift: 0,
    });
    this.feet = [foot(), foot()];
  }

  /**
   * Moves the feet on to where the body is now, `dt` seconds after the last
   * update. That can be every tick, or (since it's only looks) every frame
   * the body's drawn, with the game time since the last one.
   */
  update([x, y]: V2d, facing: number, dt: number) {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const first = Number.isNaN(distance);
    this.x = x;
    this.y = y;
    // A teleport, or the first we've seen of it: start out standing square
    if (first || distance > TELEPORT_DISTANCE) {
      this.stand(first ? facing : this.hipAngle);
      return;
    }
    if (dt <= 0) {
      return;
    }

    const movedAngle = Math.atan2(dy, dx);
    this.speed = distance / dt;
    const { style } = this;
    const moving = this.speed > STANDING_SPEED;

    // Shorter steps going sideways
    const across = moving ? Math.abs(Math.sin(movedAngle - facing)) : 0;
    const targetReach = moving
      ? Math.min(
          style.minReach + this.speed * style.reachPerSpeed,
          style.maxReach,
        ) * lerp(1, SIDESTEP_REACH, across)
      : 0;
    this.reach = approach(this.reach, targetReach, REACH_RESPONSE, dt);
    this.duty = lerp(
      style.walkDuty,
      style.runDuty,
      clamp(this.speed / style.runSpeed),
    );
    if (moving) {
      this.travelAngle = approachAngle(
        this.travelAngle,
        movedAngle,
        TRAVEL_RESPONSE,
        dt,
      );
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
    this.placeHips();

    if (moving) {
      this.walk(distance, dt);
    } else {
      this.settle(dt);
    }
    this.moving = moving;
  }

  /** Moving: the cycle lifts and lands the feet */
  private walk(distance: number, dt: number) {
    // The cycle's length is the distance the body goes in one: twice the reach while a foot's down, and the rest while it's up
    const cycleLength = (2 * Math.max(this.reach, 0.05)) / this.duty;
    this.settling = false;
    if (!this.moving) {
      // Setting off: the foot further behind goes first, now
      const behind = (side: 0 | 1) => this.along(side);
      const lead = behind(1) < behind(0) ? 1 : 0;
      this.phase = mod(this.duty - lead * 0.5 - 1e-6, 1);
      for (const side of SIDES) {
        const swing = this.swings[side];
        if (swing && swing.duration === undefined) {
          swing.duration = SETTLE_TIME;
        }
      }
    }
    const before = this.phase;
    this.phase = mod(this.phase + distance / cycleLength, 1);
    const travelX = Math.cos(this.travelAngle);
    const travelY = Math.sin(this.travelAngle);

    for (const side of SIDES) {
      const foot = this.feet[side];
      const from = mod(before + side * 0.5, 1);
      const u = mod(this.phase + side * 0.5, 1);
      const wrapped = u < from;
      const lifts = from < this.duty && (u >= this.duty || wrapped);
      if (foot.planted) {
        if (lifts || this.stretched(side)) {
          this.liftFoot(side, lifts ? undefined : SETTLE_TIME);
        } else {
          continue;
        }
      }
      const swing = this.swings[side]!;
      let remaining: number;
      if (swing.duration !== undefined) {
        swing.t = Math.min(1, swing.t + dt / swing.duration);
        remaining = (1 - swing.t) * swing.duration * this.speed;
      } else {
        // The cycle carries it: lifted at `duty`, down at 1
        swing.t =
          wrapped || u < this.duty ? 1 : (u - this.duty) / (1 - this.duty);
        remaining = (1 - swing.t) * (1 - this.duty) * cycleLength;
      }
      // Where its hip will be when it lands, and its reach on from there
      const ahead = this.reach + remaining;
      this.moveFoot(
        side,
        this.hipX(side) + travelX * ahead,
        this.hipY(side) + travelY * ahead,
        Math.max(this.stride, SETTLE_LIFT),
      );
    }
  }

  /** Standing: feet that aren't under their hips step back under them, one at a time */
  private settle(dt: number) {
    for (const side of SIDES) {
      const swing = this.swings[side];
      if (swing) {
        if (swing.duration === undefined) {
          swing.duration = SETTLE_TIME;
        }
        swing.t = Math.min(1, swing.t + dt / swing.duration);
        this.moveFoot(side, this.hipX(side), this.hipY(side), SETTLE_LIFT);
      }
    }
    if (this.swings[0] || this.swings[1]) {
      return;
    }
    // The foot furthest out of place steps first. Once one has, the other
    // follows unless it's already square, so they end up side by side.
    const [distance, turn] = this.settling
      ? [SQUARE_DISTANCE, SQUARE_TURN]
      : [SETTLE_DISTANCE, SETTLE_TURN];
    const outOfPlace = (side: 0 | 1) => {
      const foot = this.feet[side];
      const turned = Math.abs(angleDelta(foot.angle, this.hipAngle));
      return Math.max(this.away(side) / distance, turned / turn);
    };
    const side = outOfPlace(1) > outOfPlace(0) ? 1 : 0;
    this.settling = outOfPlace(side) > 1;
    if (this.settling) {
      this.liftFoot(side, SETTLE_TIME);
    }
  }

  /** How far a foot is from under its hip (meters) */
  private away(side: 0 | 1): number {
    const foot = this.feet[side];
    const dx = foot.x - this.hipX(side);
    const dy = foot.y - this.hipY(side);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private liftFoot(side: 0 | 1, duration?: number) {
    const foot = this.feet[side];
    foot.planted = false;
    this.swings[side] = {
      fromX: foot.x,
      fromY: foot.y,
      fromAngle: foot.angle,
      t: 0,
      duration,
    };
  }

  /** Moves a foot in the air along its swing toward where it'll land, and puts it down at the end */
  private moveFoot(side: 0 | 1, toX: number, toY: number, height: number) {
    const foot = this.feet[side];
    const swing = this.swings[side]!;
    const eased = smoothStep(swing.t);
    foot.x = lerp(swing.fromX, toX, eased);
    foot.y = lerp(swing.fromY, toY, eased);
    foot.angle =
      swing.fromAngle + angleDelta(swing.fromAngle, this.hipAngle) * eased;
    foot.lift = Math.sin(Math.PI * swing.t) * this.style.lift * height;
    if (swing.t >= 1) {
      const settling = swing.duration !== undefined;
      foot.planted = true;
      foot.lift = 0;
      this.swings[side] = undefined;
      this.onLand?.({
        side,
        position: V(foot.x, foot.y),
        angle: foot.angle,
        speed: this.speed,
        settling,
      });
    }
  }

  /** Both feet down under the hips, without a step */
  private stand(facing: number) {
    this.hipAngle = facing;
    this.placeHips();
    this.travelAngle = facing;
    this.reach = 0;
    this.speed = 0;
    this.moving = false;
    for (const side of SIDES) {
      const foot = this.feet[side];
      foot.x = this.hipX(side);
      foot.y = this.hipY(side);
      foot.angle = facing;
      foot.planted = true;
      foot.lift = 0;
      this.swings[side] = undefined;
    }
  }

  /** Whether a foot that's down has been left too far behind to wait for its turn */
  private stretched(side: 0 | 1): boolean {
    return this.away(side) > this.style.maxReach * MAX_STRETCH;
  }

  /** Works out where the left hip is from the middle, after `hipAngle` changes */
  private placeHips() {
    this.hipOffsetX = Math.sin(this.hipAngle) * this.hipWidth;
    this.hipOffsetY = -Math.cos(this.hipAngle) * this.hipWidth;
  }

  /** Where a hip is, in the world: the left is a quarter turn left of the way the hips point */
  hipX(side: 0 | 1): number {
    return side === 0 ? this.x + this.hipOffsetX : this.x - this.hipOffsetX;
  }

  hipY(side: 0 | 1): number {
    return side === 0 ? this.y + this.hipOffsetY : this.y - this.hipOffsetY;
  }

  /** How far a foot is ahead of its hip (meters), in the direction of travel: behind is negative */
  along(side: 0 | 1): number {
    const foot = this.feet[side];
    return (
      (foot.x - this.hipX(side)) * Math.cos(this.travelAngle) +
      (foot.y - this.hipY(side)) * Math.sin(this.travelAngle)
    );
  }

  /** Whether both feet are down under their hips, where the body hides them */
  get underBody(): boolean {
    const [left, right] = this.feet;
    return (
      left.planted &&
      right.planted &&
      this.away(0) <= SQUARE_DISTANCE &&
      this.away(1) <= SQUARE_DISTANCE
    );
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
