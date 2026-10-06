/**
 * How something hanging off a moving body swings: a ponytail, a badge on a
 * lanyard, a tie, a bag. It's worked out, not played: its tip is a weight on
 * a spring, pulled toward where it hangs at rest (`length` from its pivot,
 * along `restAngle`), left behind as the pivot speeds up, flung on when it
 * stops or turns, and slowed by the air. What it gives back is how far it's
 * swung from rest (`angle`) and how much longer than at rest it looks from
 * above (`stretch`: lifted out behind, longer; swung in under, shorter),
 * which is all a sprite turned and stretched about its pivot needs.
 */
export interface DangleStyle {
  /** How quickly it swings back: swings a second, left to itself */
  frequency: number;
  /** How soon a swing dies down: 0 never, 1 not even one overshoot */
  dampingRatio: number;
  /**
   * Air drag (per second): how much it trails behind going along. With
   * none, at a steady speed it hangs as it does standing still
   */
  drag: number;
  /** The most it swings either side of rest (radians) */
  maxAngle: number;
  /** How short and how long it can look, next to its rest length */
  minStretch: number;
  maxStretch: number;
}

/** Updates longer than this (seconds) put it back at rest instead: it's been out of view, or paused */
const MAX_DT = 0.25;
/** A pivot moving further than this between updates (meters) has teleported */
const TELEPORT_DISTANCE = 1;
/** The longest step it's moved on in (seconds), so stiff springs stay stable */
const MAX_STEP = 1 / 120;

export class Dangle {
  /** Where its tip is in the world, and how fast it's going */
  tipX = 0;
  tipY = 0;
  velX = 0;
  velY = 0;
  /** As of the last update: how far it's swung from rest (radians, + toward +y of the rest direction) */
  angle = 0;
  /** As of the last update: how long it looks next to its rest length */
  stretch = 1;

  private pivotX = 0;
  private pivotY = 0;
  private restAngle = 0;
  private started = false;

  constructor(
    public style: DangleStyle,
    /** From its pivot to its tip at rest (meters) */
    public length: number,
  ) {}

  /** Hangs it at rest, still */
  reset(pivotX: number, pivotY: number, restAngle: number) {
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.restAngle = restAngle;
    this.tipX = pivotX + Math.cos(restAngle) * this.length;
    this.tipY = pivotY + Math.sin(restAngle) * this.length;
    this.velX = 0;
    this.velY = 0;
    this.angle = 0;
    this.stretch = 1;
    this.started = true;
  }

  /** Gives its tip a shove (meters per second) */
  push(vx: number, vy: number) {
    this.velX += vx;
    this.velY += vy;
  }

  /**
   * Moves it on by `dt` seconds, its pivot having moved to here and turned
   * to `restAngle` (in the world) since the last update, at a steady speed
   */
  update(pivotX: number, pivotY: number, restAngle: number, dt: number) {
    const moved = Math.hypot(pivotX - this.pivotX, pivotY - this.pivotY);
    if (!this.started || dt > MAX_DT || moved > TELEPORT_DISTANCE) {
      this.reset(pivotX, pivotY, restAngle);
      return;
    }
    if (dt <= 0) {
      return;
    }
    const { style, length } = this;
    const omega = style.frequency * Math.PI * 2;
    const stiffness = omega * omega;
    const damping = 2 * style.dampingRatio * omega;
    const minLength = length * style.minStretch;
    const maxLength = length * style.maxStretch;

    // The pivot and the way it hangs, from where they were to where they are
    const fromX = this.pivotX;
    const fromY = this.pivotY;
    const fromAngle = this.restAngle;
    let turn = restAngle - fromAngle;
    turn -= Math.round(turn / (Math.PI * 2)) * Math.PI * 2;
    const pivotVX = (pivotX - fromX) / dt;
    const pivotVY = (pivotY - fromY) / dt;

    const steps = Math.ceil(dt / MAX_STEP);
    const h = dt / steps;
    let angle = 0;
    let distance = length;
    const spin = turn / dt;
    for (let i = 1; i <= steps; i++) {
      // Pulled toward where it'd hang at rest at the start of the step, and
      // that point's speed (the pivot's, and turning about it)
      const t0 = (i - 1) / steps;
      const rest0 = fromAngle + turn * t0;
      const cos0 = Math.cos(rest0);
      const sin0 = Math.sin(rest0);
      const restX = fromX + (pivotX - fromX) * t0 + cos0 * length;
      const restY = fromY + (pivotY - fromY) * t0 + sin0 * length;
      const restVX = pivotVX - sin0 * length * spin;
      const restVY = pivotVY + cos0 * length * spin;

      const ax =
        stiffness * (restX - this.tipX) -
        damping * (this.velX - restVX) -
        style.drag * this.velX;
      const ay =
        stiffness * (restY - this.tipY) -
        damping * (this.velY - restVY) -
        style.drag * this.velY;
      this.velX += ax * h;
      this.velY += ay * h;
      this.tipX += this.velX * h;
      this.tipY += this.velY * h;

      // Where the pivot is at the end of the step
      const t = i / steps;
      const px = fromX + (pivotX - fromX) * t;
      const py = fromY + (pivotY - fromY) * t;
      const rest = fromAngle + turn * t;
      const cos = Math.cos(rest);
      const sin = Math.sin(rest);

      // Kept within its limits, in the frame it hangs in: along it, and across
      const rx = this.tipX - px;
      const ry = this.tipY - py;
      const along = rx * cos + ry * sin;
      const across = -rx * sin + ry * cos;
      angle = Math.atan2(across, along);
      distance = Math.hypot(along, across);
      const clampedAngle = Math.max(
        -style.maxAngle,
        Math.min(style.maxAngle, angle),
      );
      const clampedDistance = Math.max(
        minLength,
        Math.min(maxLength, distance),
      );
      if (clampedAngle !== angle || clampedDistance !== distance) {
        const outX = Math.cos(rest + clampedAngle);
        const outY = Math.sin(rest + clampedAngle);
        this.tipX = px + outX * clampedDistance;
        this.tipY = py + outY * clampedDistance;
        // Stopped going any further the way it was held back
        const relVX = this.velX - pivotVX;
        const relVY = this.velY - pivotVY;
        let radial = relVX * outX + relVY * outY;
        let tangential = -relVX * outY + relVY * outX;
        if (
          (clampedDistance > distance && radial < 0) ||
          (clampedDistance < distance && radial > 0)
        ) {
          radial = 0;
        }
        if (
          (clampedAngle > angle && tangential < 0) ||
          (clampedAngle < angle && tangential > 0)
        ) {
          tangential = 0;
        }
        this.velX = pivotVX + radial * outX - tangential * outY;
        this.velY = pivotVY + radial * outY + tangential * outX;
        angle = clampedAngle;
        distance = clampedDistance;
      }
    }
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.restAngle = restAngle;
    this.angle = angle;
    this.stretch = distance / length;
  }
}
