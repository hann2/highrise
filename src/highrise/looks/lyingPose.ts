/**
 * How a body lies face down, its limbs bent: worked out for each `Corpse`
 * from how it died (`DeathContext`), and for the stills of one
 * (`composeBodySvg`) from nothing in particular, so they look alike.
 *
 * Each limb picks what it's doing (an `Intent`: reaching up past the head,
 * trailing down by the side, flung out, drawn up, caught under it...) by
 * weights that how it died shifts: a hard blow flings the arms back and the
 * legs apart, a light one drops it where it stood, its arms still where
 * they were and a knee buckled; an explosion throws everything out; fire
 * draws the arms and knees up; a sprinter falls on mid-stride; an arm
 * that's gone leaves the other flung out, and a body without its head lies
 * limp. Then where in that intent's range it lies is random, and a pose
 * where a hand's on the head, the hands are on each other, a limb crosses
 * to the other side or a foot's on a hand is tried again.
 *
 * Angles are in the body's frame, from +x (toward the head), turning toward
 * +y (its right). `angle` is which way a limb's upper half (the upper arm,
 * the thigh) points from the shoulder or hip, and `bend` how far its lower
 * half turns from that at the elbow or knee; intents are given for the right
 * side and mirrored for the left.
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

/** How big a body lying face down is, in any one unit, for keeping its limbs out of each other */
export interface LyingBody {
  /** How far out from the middle each shoulder joint is */
  shoulder: number;
  upperArm: number;
  forearm: number;
  /** Each hip joint: how far behind the shoulders, and out from the middle */
  hipX: number;
  hipY: number;
  thigh: number;
  shin: number;
  /** Where the head's middle is in front of the shoulders, and how big it is */
  headX: number;
  headRadius: number;
  /** How big a hand or a foot is, about */
  handRadius: number;
}

/** What a blow was, as far as how it lies goes */
export type DeathKind = "bullet" | "melee" | "explosion" | "burn" | "none";

/**
 * How a body died, in its frame lying down (+x toward its head, which is
 * the way it fell): what decides how it lies
 */
export interface DeathContext {
  kind: DeathKind;
  /** How hard it was hit, 0 (it just dropped) to 1 (thrown) */
  force: number;
  /** Where across it the blow struck: -1 its left, 1 its right, 0 the middle */
  side: number;
  /** How fast it was going as it fell, 0 to 1 (a sprinter flat out) */
  speed: number;
  /** What it's lost */
  missing: {
    head: boolean;
    leftArm: boolean;
    rightArm: boolean;
    legs: boolean;
  };
  /**
   * Where each hand was from its shoulder, standing: which way, in this
   * frame (from +x toward its own side, so 0 is reaching on past the head
   * and π back toward the feet), and how far out, as a share of the arm
   */
  arms?: [StandingLimb | undefined, StandingLimb | undefined];
  /** Where each foot was from its hip, standing, the same way, as a share of the leg */
  legs?: [StandingLimb | undefined, StandingLimb | undefined];
  /** Already lying down when it died (a crawler) */
  lying?: boolean;
}

export interface StandingLimb {
  angle: number;
  reach: number;
}

/** A body that just dropped, of nothing in particular: for stills */
export const NO_DEATH: DeathContext = {
  kind: "none",
  force: 0.4,
  side: 0,
  speed: 0,
  missing: { head: false, leftArm: false, rightArm: false, legs: false },
};

/**
 * What a limb's doing, for the right side: the ranges its `angle` and
 * `bend` are picked from
 */
interface Intent {
  angle: [number, number];
  bend: [number, number];
}

type ArmIntent = "reach" | "bentUp" | "out" | "trail" | "under" | "kept";
type LegIntent = "straight" | "apart" | "kneeUp" | "kneeOut" | "curled";

const ARM_INTENTS: Record<Exclude<ArmIntent, "kept">, Intent> = {
  /** Up past the head, a little bent */
  reach: { angle: [0.55, 1.1], bend: [-0.75, -0.1] },
  /** Up by the head, bent sharply back toward it */
  bentUp: { angle: [1.15, 1.6], bend: [-1.75, -1.1] },
  /** Flung out to the side */
  out: { angle: [1.4, 2.1], bend: [-0.2, 0.7] },
  /** Down by the side, toward the feet */
  trail: { angle: [2.55, 2.95], bend: [-0.1, 0.35] },
  /** Caught under it, the hand in under the hips */
  under: { angle: [2.85, 3.08], bend: [-0.75, -0.35] },
};

const LEG_INTENTS: Record<LegIntent, Intent> = {
  straight: { angle: [Math.PI - 0.16, Math.PI - 0.02], bend: [-0.02, 0.1] },
  apart: { angle: [Math.PI - 0.45, Math.PI - 0.2], bend: [0, 0.3] },
  /** Drawn up and out, the shin back along the body */
  kneeUp: { angle: [Math.PI - 1.05, Math.PI - 0.65], bend: [0.95, 1.5] },
  /** Bent out to the side a little */
  kneeOut: { angle: [Math.PI - 0.55, Math.PI - 0.3], bend: [0.4, 0.8] },
  /** Drawn right up, as fire curls a body */
  curled: { angle: [Math.PI - 1.4, Math.PI - 1.0], bend: [1.6, 2.1] },
};

/** How many times a limb's tried again before it settles for something safe */
const TRIES = 12;

/**
 * A pose to lie in, `body` that big, having died like `death`, with
 * `random` (0 to 1) picking what each limb does and how
 */
export function lyingPose(
  random: () => number,
  body: LyingBody,
  death: DeathContext = NO_DEATH,
): LyingPose {
  const between = ([a, b]: [number, number]) => a + (b - a) * random();
  const pickFrom = <T extends string>(weights: [T, number][]): T => {
    const total = weights.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
    let r = random() * total;
    for (const [value, w] of weights) {
      r -= Math.max(0, w);
      if (r <= 0) {
        return value;
      }
    }
    return weights[weights.length - 1][0];
  };
  const { force, kind, side: struck, speed, missing } = death;
  const burnt = kind === "burn";
  const limp = missing.head;

  // The legs first, since a hand mustn't land on a foot
  const legIntents: LegIntent[] = [-1, 1].map((side, i) => {
    const standing = death.legs?.[i];
    // A foot that was out in front (toward the head now) buckles, one
    // back stays straight
    const stride = standing ? Math.cos(standing.angle) * standing.reach : 0;
    return pickFrom<LegIntent>([
      ["straight", 1.6 + force - stride * 2],
      ["apart", 0.8 + force * 1.5 + (kind === "explosion" ? 2.5 : 0)],
      [
        "kneeUp",
        0.5 + (1 - force) * 0.9 + Math.max(0, stride) * 3 + speed * 1.2,
      ],
      ["kneeOut", 0.5 + (struck * side > 0.3 ? force : 0)],
      ["curled", burnt ? 4 : 0],
    ]);
  });
  // Both knees up is a body curled by fire; else, mostly, only one
  const bent = (intent: LegIntent) =>
    intent === "kneeUp" || intent === "curled";
  if (!burnt && bent(legIntents[0]) && bent(legIntents[1]) && random() < 0.75) {
    legIntents[random() < 0.5 ? 0 : 1] = "straight";
  }

  const shoulderY = body.shoulder;
  const hips: [number, number][] = [
    [-body.hipX, -body.hipY],
    [-body.hipX, body.hipY],
  ];
  const legs: [LimbPose, LimbPose] = [
    { angle: -Math.PI, bend: 0 },
    { angle: Math.PI, bend: 0 },
  ];
  const ankles: [number, number][] = [];
  const knees: [number, number][] = [];
  for (const i of [0, 1]) {
    const side = i === 0 ? -1 : 1;
    let pose: LimbPose = { angle: side * (Math.PI - 0.08), bend: side * 0.03 };
    let intent = legIntents[i];
    for (let attempt = 0; attempt < TRIES; attempt++) {
      const range = LEG_INTENTS[intent];
      const candidate = {
        angle: side * between(range.angle),
        bend: side * between(range.bend),
      };
      const joints = limbJoints(hips[i], candidate, body.thigh, body.shin);
      // Each leg stays on its own side, and clear of the other
      const ownSide =
        joints.end[1] * side > body.handRadius * 0.3 &&
        joints.middle[1] * side > 0;
      const other = i === 1 ? ankles[0] : undefined;
      const apart =
        !other ||
        Math.hypot(joints.end[0] - other[0], joints.end[1] - other[1]) >
          body.handRadius * 3;
      if (ownSide && apart) {
        pose = candidate;
        break;
      }
      intent = pickFrom<LegIntent>([
        ["straight", 2],
        ["apart", 1],
      ]);
    }
    legs[i] = pose;
    const joints = limbJoints(hips[i], pose, body.thigh, body.shin);
    knees.push(joints.middle);
    ankles.push(joints.end);
  }

  // The arms
  const head: [number, number] = [body.headX, 0];
  const arms: [LimbPose, LimbPose] = [
    { angle: -2.7, bend: 0 },
    { angle: 2.7, bend: 0 },
  ];
  const hands: ([number, number] | undefined)[] = [];
  for (const i of [0, 1]) {
    const side = i === 0 ? -1 : 1;
    const shoulder: [number, number] = [0, side * shoulderY];
    if (i === 0 ? missing.leftArm : missing.rightArm) {
      hands.push(undefined);
      continue;
    }
    const otherGone = i === 0 ? missing.rightArm : missing.leftArm;
    const standing = death.arms?.[i];
    const hitHere = struck * side > 0.3;
    const weights: [ArmIntent, number][] = [
      [
        "reach",
        0.9 +
          (1 - force) * 0.6 +
          (missing.legs ? 2.5 : 0) +
          (otherGone ? 1 : 0) +
          (death.lying ? 2 : 0),
      ],
      ["bentUp", limp ? 0 : 0.7 + (burnt ? 5 : 0)],
      [
        "out",
        0.8 +
          (kind === "explosion" ? 2.5 : 0) +
          (hitHere ? force * 2 : 0) +
          (otherGone ? 1.5 : 0) +
          (limp ? 1 : 0),
      ],
      ["trail", 0.7 + force * 2 + speed * 1.5 + (limp ? 1 : 0)],
      ["under", burnt || death.lying ? 0 : 0.35 * (1 - force)],
      // Light blows leave the arms where they were
      ["kept", standing ? 3 * (1 - force) * (burnt ? 0.2 : 1) : 0],
    ];
    let pose: LimbPose = { angle: side * 2.75, bend: side * 0.1 };
    for (let attempt = 0; attempt < TRIES; attempt++) {
      const intent = pickFrom(weights);
      let candidate: LimbPose;
      if (intent === "kept" && standing) {
        // Its way from the shoulder, on its own side, eased onto the floor
        // round from straight up or straight down, bent as much as its hand
        // was close in
        const way = Math.min(Math.PI - 0.05, Math.max(0.3, standing.angle));
        candidate = {
          angle: side * (way + (random() - 0.5) * 0.4),
          bend:
            -side *
            Math.min(1.6, Math.max(0, (1 - standing.reach) * 2.2)) *
            (0.6 + random() * 0.6),
        };
      } else {
        const range = ARM_INTENTS[intent as Exclude<ArmIntent, "kept">];
        candidate = {
          angle: side * between(range.angle),
          bend: side * between(range.bend),
        };
      }
      // Without its head it lies limp, barely bent
      if (limp) {
        candidate.bend *= 0.5;
      }
      const joints = limbJoints(
        shoulder,
        candidate,
        body.upperArm,
        body.forearm,
      );
      const hand = joints.end;
      const clear = (at: [number, number] | undefined, distance: number) =>
        !at || Math.hypot(hand[0] - at[0], hand[1] - at[1]) > distance;
      const ok =
        // Not on the head, if it has one
        (missing.head || clear(head, body.headRadius + body.handRadius)) &&
        // On its own side: the elbow out past the shoulder, and the hand
        // no further across than in under the middle
        joints.middle[1] * side > shoulderY * 0.4 &&
        hand[1] * side > -shoulderY * 0.15 &&
        // Not on the other hand, or a knee or a foot
        clear(hands[0], body.handRadius * 2.4) &&
        knees.every((knee) => clear(knee, body.handRadius * 2.2)) &&
        ankles.every((ankle) => clear(ankle, body.handRadius * 2.6));
      if (ok) {
        pose = candidate;
        break;
      }
    }
    arms[i] = pose;
    hands.push(limbJoints(shoulder, pose, body.upperArm, body.forearm).end);
  }

  return {
    arms,
    legs,
    // Burnt feet are drawn up less out to the side; all of them turned out
    feet: [0.9 + random() * 0.5, -(0.9 + random() * 0.5)],
    head: {
      angle: (random() - 0.5) * 0.6,
      // Knocked away from where it was hit, mostly
      facesLeft:
        struck > 0.3
          ? random() < 0.8
          : struck < -0.3
            ? random() < 0.2
            : random() < 0.5,
    },
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
