/**
 * How a body lies face down, its limbs bent: the same for a `Corpse` and
 * the stills of one (`composeBodySvg`), so they look alike. Picked from a
 * handful of poses a body falls into, each a little different every time.
 *
 * Angles are in the body's frame, from +x (toward the head), turning toward
 * +y (its right). Each limb's are given for the right side and mirrored for
 * the left: `angle` is which way its upper half (the upper arm, the thigh)
 * points from the shoulder or hip, and `bend` how far its lower half turns
 * from that at the elbow or knee.
 */

export interface LimbPose {
  angle: number;
  bend: number;
}

export interface LyingPose {
  /** Left (-y) and right (+y) */
  arms: [LimbPose, LimbPose];
  legs: [LimbPose, LimbPose];
  /** How far each foot's turned at the ankle from the shin, out to the side, to lie on its side */
  feet: [number, number];
  /** How far the head's turned from straight, and whether it faces left (-y) */
  head: { angle: number; facesLeft: boolean };
}

/** A pose for the right side; the left's is mirrored */
type Side = { arm: LimbPose; leg: LimbPose };

/** Arms */
const UP_BY_HEAD: LimbPose = { angle: 0.85, bend: -0.55 };
const BENT_BY_HEAD: LimbPose = { angle: 1.35, bend: -1.45 };
const DOWN_BY_SIDE: LimbPose = { angle: Math.PI - 0.3, bend: 0.2 };
const OUT_TO_SIDE: LimbPose = { angle: 1.75, bend: 0.55 };
const UNDER_BODY: LimbPose = { angle: Math.PI - 0.12, bend: -0.6 };

/** Legs */
const STRAIGHT: LimbPose = { angle: Math.PI - 0.08, bend: 0.03 };
const APART: LimbPose = { angle: Math.PI - 0.22, bend: 0.12 };
const KNEE_UP: LimbPose = { angle: Math.PI - 0.8, bend: 1.25 };
const KNEE_OUT: LimbPose = { angle: Math.PI - 0.45, bend: 0.6 };

/** The poses a body falls into, as [right, left] before mirroring */
const POSES: [Side, Side][] = [
  // Reaching out ahead, the other knee drawn up
  [
    { arm: UP_BY_HEAD, leg: STRAIGHT },
    { arm: DOWN_BY_SIDE, leg: KNEE_UP },
  ],
  // Both arms bent up by the head
  [
    { arm: BENT_BY_HEAD, leg: APART },
    { arm: BENT_BY_HEAD, leg: STRAIGHT },
  ],
  // Sprawled, arms flung out
  [
    { arm: OUT_TO_SIDE, leg: KNEE_OUT },
    { arm: OUT_TO_SIDE, leg: APART },
  ],
  // One arm caught under it, the other up by the head
  [
    { arm: UNDER_BODY, leg: STRAIGHT },
    { arm: BENT_BY_HEAD, leg: KNEE_OUT },
  ],
  // Arms down by its sides
  [
    { arm: DOWN_BY_SIDE, leg: STRAIGHT },
    { arm: DOWN_BY_SIDE, leg: APART },
  ],
  // Reaching, one arm out
  [
    { arm: UP_BY_HEAD, leg: KNEE_UP },
    { arm: OUT_TO_SIDE, leg: STRAIGHT },
  ],
];

/** A pose to lie in, with `random` (0 to 1) picking which and how it differs */
export function lyingPose(random: () => number): LyingPose {
  const [first, second] = POSES[Math.floor(random() * POSES.length)];
  // Which side gets which half of it
  const [right, left] = random() < 0.5 ? [first, second] : [second, first];
  const jiggle = (limb: LimbPose, side: number, amount: number): LimbPose => ({
    angle: side * (limb.angle + (random() - 0.5) * amount),
    bend: side * (limb.bend + (random() - 0.5) * amount),
  });
  return {
    arms: [jiggle(left.arm, -1, 0.5), jiggle(right.arm, 1, 0.5)],
    legs: [jiggle(left.leg, -1, 0.25), jiggle(right.leg, 1, 0.25)],
    feet: [1 + random() * 0.4, -(1 + random() * 0.4)],
    head: { angle: (random() - 0.5) * 0.6, facesLeft: random() < 0.5 },
  };
}

/**
 * Where a limb's joints go, from where it's attached, `upper` long to the
 * elbow or knee and `lower` from there to the hand or ankle
 */
export function limbJoints(
  [x, y]: readonly [number, number],
  limb: LimbPose,
  upper: number,
  lower: number,
): { middle: [number, number]; end: [number, number]; endAngle: number } {
  const middle: [number, number] = [
    x + Math.cos(limb.angle) * upper,
    y + Math.sin(limb.angle) * upper,
  ];
  const endAngle = limb.angle + limb.bend;
  return {
    middle,
    end: [
      middle[0] + Math.cos(endAngle) * lower,
      middle[1] + Math.sin(endAngle) * lower,
    ],
    endAngle,
  };
}
