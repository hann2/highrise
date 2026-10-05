/** How far below the shoulders the hands are, for bending the arms (m, for a human) */
export const ARM_DROP = 0.2;

/**
 * Where an elbow is, seen from above. The arm is bent in 3D, with the hand
 * a little below the shoulder (`drop`) and the elbow hanging down and a
 * little out to the side (`outward`, from 0 straight down to 1 as far out
 * as down), then looked at from above: so an arm reaching out straight is
 * long, and one with the hand close in is short, with a slight bend out at
 * the elbow, as arms look from above. Too far to reach, it's straight.
 *
 * Positions are 2D in the body's own frame, with its middle at the origin
 * (the elbow goes out on the shoulder's side); lengths in the same units.
 */
export function elbowPosition(
  shoulder: readonly [number, number],
  hand: readonly [number, number],
  upper: number,
  fore: number,
  drop: number,
  outward = 0.2,
): [number, number] {
  const [sx, sy] = shoulder;
  const vx = hand[0] - sx;
  const vy = hand[1] - sy;
  const vz = -drop;
  const d = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (d >= upper + fore - 1e-9 || d < 1e-9) {
    const t = upper / (upper + fore);
    return [sx + vx * t, sy + vy * t];
  }
  const ux = vx / d;
  const uy = vy / d;
  const uz = vz / d;
  // How far along the shoulder-to-hand line the elbow is, and out from it
  const along = (upper * upper - fore * fore + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(0, upper * upper - along * along));
  // Which way it bends: down and out, square to the shoulder-to-hand line
  let px = 0;
  let py = Math.sign(sy || 1) * outward;
  let pz = -1;
  const dot = px * ux + py * uy + pz * uz;
  px -= ux * dot;
  py -= uy * dot;
  pz -= uz * dot;
  const length = Math.sqrt(px * px + py * py + pz * pz) || 1;
  return [
    sx + ux * along + (px / length) * out,
    sy + uy * along + (py / length) * out,
  ];
}
