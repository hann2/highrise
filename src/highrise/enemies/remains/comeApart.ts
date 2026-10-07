import { Container, Sprite } from "pixi.js";
import { Texture } from "pixi.js";
import { CollisionGroups } from "../../../config/CollisionGroups";
import Game from "../../../core/Game";
import { colorLerp, darken } from "../../../core/util/ColorUtils";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose, rNormal, rSign, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import type {
  BodyPoses,
  BodySprite,
  BodyTextures,
} from "../../creature-stuff/BodySprite";
import FleshImpact from "../../effects/FleshImpact";
import { BLOB_TEXTURES } from "../../effects/Splat";
import type Burning from "../../fire/Burning";
import type { DeathBlow } from "../base/DeathBlow";
import { bodyPixelScale } from "../../looks/bakeBodies";
import { HUMAN_RADIUS } from "../../constants/constants";
import Corpse, { CHARRED_TINT, CorpseParts } from "./Corpse";
import type {
  DeathContext,
  DeathKind,
  StandingLimb,
} from "../../looks/lyingPose";
import Gib from "./Gib";
import { bentArm, lyingBodyOf, posedLegs } from "./lyingLimbs";
import { lyingPose, NO_DEATH } from "../../looks/lyingPose";

// How much damage (the blow plus what came just before) it takes to...
/** ...pop the head, with a bullet or a swing to it */
const HEAD_DAMAGE = 30;
/** ...take off an arm, with a bullet or a swing to it */
const ARM_DAMAGE = 40;
/** ...cut it in half with bullets (a shotgun up close) */
const HALVE_BULLET_DAMAGE = 90;
/** ...cut it in half with a swing (an axe) */
const HALVE_MELEE_DAMAGE = 80;
/** ...blow it apart with bullets */
const GIB_BULLET_DAMAGE = 150;
/** ...cut it in half with an explosion */
const HALVE_EXPLOSION_DAMAGE = 60;
/** ...blow it apart with an explosion */
const GIB_EXPLOSION_DAMAGE = 100;

/** How much of the head's drawn radius counts as the head, for a bullet's path */
const HEAD_HIT_FRACTION = 0.75;
/** How charred something that dies burning starts out */
const CHAR_AT_DEATH = 0.5;
/** Seconds of its speed it keeps sliding when it falls */
const SLIDE_TIME = 0.15;
/** Meters it's thrown back by a blow of 100 damage */
const THROWN_PER_100_DAMAGE = 0.5;
/** How far from walls it ends up, so it doesn't lie in them */
const WALL_MARGIN = 0.35;

export type HitPart = "head" | "leftArm" | "rightArm" | "torso";

export type DeathStyle =
  /** Falls over in one piece */
  | "fall"
  /** A bullet to the head bursts it */
  | "headPopped"
  /** A swing to the head knocks it off */
  | "headOff"
  | "leftArmOff"
  | "rightArmOff"
  /** In two: the top half one way, the legs left behind */
  | "halved"
  /** In pieces everywhere */
  | "gibbed";

/**
 * Which part a blow hit. Bullets and swings go by their path, since the head
 * is in the middle when seen from above, and explosions by the nearest part.
 */
export function hitPart(poses: BodyPoses, blow: DeathBlow): HitPart {
  const { position, direction } = blow;
  if (!position) {
    return "torso";
  }
  const arms: [HitPart, V2d, V2d][] = [
    ["leftArm", poses.leftShoulder, poses.leftHand.position],
    ["rightArm", poses.rightShoulder, poses.rightHand.position],
  ];

  if (direction && (blow.kind === "bullet" || blow.kind === "melee")) {
    // Distance of a point from the path, on one side or the other
    const side = (p: V2d) => direction.crossLength(p.sub(position));
    if (
      Math.abs(side(poses.head.position)) <
      poses.headRadius * HEAD_HIT_FRACTION
    ) {
      return "head";
    }
    let best: HitPart = "torso";
    let bestDistance = poses.armThickness;
    for (const [part, shoulder, hand] of arms) {
      const a = side(shoulder);
      const b = side(hand);
      const distance =
        Math.sign(a) !== Math.sign(b) ? 0 : Math.min(Math.abs(a), Math.abs(b));
      if (distance < bestDistance) {
        best = part;
        bestDistance = distance;
      }
    }
    return best;
  }

  let best: HitPart = "head";
  let bestDistance = poses.head.position.distanceTo(position);
  for (const [part, shoulder, hand] of arms) {
    const distance = position.distanceTo(shoulder.lerp(hand, 0.5));
    if (distance < bestDistance) {
      best = part;
      bestDistance = distance;
    }
  }
  return bestDistance < poses.headRadius * 2 ? best : "torso";
}

/** How a blow takes a body apart. Without legs it can't be cut in half. */
export function chooseDeathStyle(
  blow: DeathBlow,
  poses: BodyPoses,
  hasLegs: boolean,
): DeathStyle {
  const { damage } = blow;
  const armOff = (part: HitPart): DeathStyle | undefined =>
    part === "leftArm"
      ? "leftArmOff"
      : part === "rightArm"
        ? "rightArmOff"
        : undefined;

  switch (blow.kind) {
    case "explosion":
      if (damage >= GIB_EXPLOSION_DAMAGE) {
        return "gibbed";
      }
      if (damage >= HALVE_EXPLOSION_DAMAGE) {
        return hasLegs ? "halved" : "gibbed";
      }
      return "fall";
    case "bullet": {
      if (damage >= GIB_BULLET_DAMAGE) {
        return "gibbed";
      }
      if (damage >= HALVE_BULLET_DAMAGE && hasLegs) {
        return "halved";
      }
      const part = hitPart(poses, blow);
      if (part === "head" && damage >= HEAD_DAMAGE) {
        return "headPopped";
      }
      if (damage >= ARM_DAMAGE) {
        return armOff(part) ?? "fall";
      }
      return "fall";
    }
    case "melee": {
      const part = hitPart(poses, blow);
      if (part === "head" && damage >= HEAD_DAMAGE) {
        return "headOff";
      }
      if (damage >= ARM_DAMAGE && armOff(part)) {
        return armOff(part)!;
      }
      if (damage >= HALVE_MELEE_DAMAGE && hasLegs) {
        return "halved";
      }
      return "fall";
    }
    default:
      return "fall";
  }
}

export interface BodyRemains {
  sprite: BodySprite;
  /** Lying down, from the waist up (a crawler's) */
  lying: BodyTextures;
  /** Its legs lying down, unless it's lost them already */
  legs?: Texture;
  /** Half the width of the body lying down, in meters */
  radius: number;
  velocity: V2d;
  tint?: number;
  burning?: Burning;
  /** Already lying down (a crawler), so it doesn't fall over */
  lyingDown?: boolean;
}

/**
 * What's left when a body dies: a corpse, a corpse and a part or two flying
 * off, or pieces everywhere, depending on `style`. `leaveCorpse: false`
 * leaves no top half (it gets back up as a crawler).
 */
export function comeApart(
  game: Game,
  blow: DeathBlow,
  style: DeathStyle,
  remains: BodyRemains,
  leaveCorpse: boolean = true,
) {
  const { sprite } = remains;
  const poses = sprite.getPartPoses();
  const position = V(sprite.sprite.position.x, sprite.sprite.position.y);
  // Falls away from the blow, else backwards
  const direction = (
    blow.direction?.clone() ?? polarToVec(sprite.sprite.rotation + Math.PI, 1)
  ).irotate(rNormal(0, 0.25));
  const char = remains.burning || blow.kind === "burn" ? CHAR_AT_DEATH : 0;
  const tint = colorLerp(remains.tint ?? 0xffffff, CHARRED_TINT, char);
  const lying = new PartMaker(remains, poses, tint);

  const parts: CorpseParts = {
    head: true,
    leftArm: true,
    rightArm: true,
    legs: !!remains.legs,
  };
  const thrown = (blow.damage / 100) * THROWN_PER_100_DAMAGE;

  switch (style) {
    case "fall": {
      spray(game, position, 3, direction, 1);
      break;
    }
    case "headPopped": {
      parts.head = false;
      const head = poses.head.position;
      spray(game, head, 12, direction, 3, 1.4);
      for (let i = 0; i < 5; i++) {
        game.addEntity(lying.chunk(head, direction, 1.2, rUniform(2, 6)));
      }
      break;
    }
    case "headOff": {
      parts.head = false;
      spray(game, poses.head.position, 4, direction, 2);
      game.addEntity(
        lying.gib(lying.head(), poses.head, direction, 0.5, rUniform(3, 5)),
      );
      break;
    }
    case "leftArmOff":
    case "rightArmOff": {
      const left = style === "leftArmOff";
      parts[left ? "leftArm" : "rightArm"] = false;
      const shoulder = left ? poses.leftShoulder : poses.rightShoulder;
      const hand = left ? poses.leftHand : poses.rightHand;
      spray(game, shoulder, 4, direction, 2);
      game.addEntity(
        lying.gib(
          lying.arm(left),
          { position: shoulder.lerp(hand.position, 0.5), angle: hand.angle },
          direction,
          0.6,
          rUniform(3, 6),
        ),
      );
      break;
    }
    case "halved": {
      parts.legs = false;
      spray(game, position, 10, direction, 2, 0.8);
      dropLegs(game, remains, direction, tint);
      break;
    }
    case "gibbed": {
      spray(game, position, 20, direction, 3, 1.2);
      const flung: [Container, { position: V2d; angle: number }][] = [
        [lying.head(), poses.head],
        [lying.arm(true), poses.leftHand],
        [lying.arm(false), poses.rightHand],
        [lying.torso(), poses.torso],
      ];
      if (remains.legs) {
        flung.push([lying.legs(remains.legs), poses.torso]);
      }
      for (const [display, pose] of flung) {
        game.addEntity(
          lying.gib(display, pose, direction, 1.3, rUniform(2.5, 7)),
        );
      }
      for (let i = 0; i < 8; i++) {
        game.addEntity(lying.chunk(position, direction, 1.6, rUniform(2, 8)));
      }
      return;
    }
  }

  if (!leaveCorpse) {
    return;
  }
  // The feet stay about where they were
  const fall = remains.lyingDown
    ? 0
    : parts.legs
      ? lying.legsLength * 0.9
      : 0.1;
  const wanted = position
    .add(direction.mul(fall + thrown))
    .iaddScaled(remains.velocity, SLIDE_TIME);
  const death = deathContext(blow, poses, remains, parts, direction.angle);
  // A blow off to one side spins it as it goes down
  const spin = remains.lyingDown ? 0 : -death.side * death.force * 0.35;
  game.addEntity(
    new Corpse({
      textures: remains.lying,
      legs: remains.legs,
      radius: remains.radius,
      position: awayFromWalls(game, position, wanted),
      angle: remains.lyingDown
        ? sprite.sprite.rotation + rNormal(0, 0.2)
        : direction.angle + spin,
      death,
      from: poses,
      standingTorso: {
        texture: sprite.textures.torso,
        scale: sprite.torsoSprite.scale.x,
      },
      parts,
      tint: remains.tint,
      char,
      burning: remains.burning && {
        timeLeft: remains.burning.timeLeft,
        source: remains.burning.source,
      },
    }),
  );
}

/** How hard a blow of this much damage is, 0 to 1, for how it lies */
const FORCE_DAMAGE = 120;
/** How fast it has to be going to fall like a sprinter flat out (m/s) */
const FALL_SPEED = 5;

/**
 * How a body died, as `lyingPose` wants it: in the frame of the corpse,
 * which lies with its head toward `angle` (the way it fell), what hit it,
 * how hard and where, what it lost, how fast it was going, and where its
 * hands and feet were
 */
function deathContext(
  blow: DeathBlow,
  poses: BodyPoses,
  remains: BodyRemains,
  parts: CorpseParts,
  angle: number,
): DeathContext {
  const kind: DeathKind =
    blow.kind === "bullet" ||
    blow.kind === "melee" ||
    blow.kind === "explosion" ||
    blow.kind === "burn"
      ? blow.kind
      : "none";
  const force =
    kind === "burn"
      ? 0.1
      : Math.min(
          1,
          blow.damage / FORCE_DAMAGE + (kind === "explosion" ? 0.3 : 0),
        );
  // Into the corpse's frame: +x toward its head, +y its right
  const lying = (v: V2d) => v.rotate(-angle);
  let side = 0;
  if (kind === "bullet" || kind === "melee") {
    const part = hitPart(poses, blow);
    side = part === "leftArm" ? -1 : part === "rightArm" ? 1 : 0;
  }
  if (side === 0 && blow.position) {
    const across = lying(blow.position.sub(poses.torso.position))[1];
    side = Math.max(-1, Math.min(1, across / 0.25));
  }
  const metrics = remains.lying.metrics;
  const size = remains.radius / HUMAN_RADIUS;
  // Which way a hand or foot was from its shoulder or hip, standing, on its
  // own side, and how far out
  const standing = (
    from: V2d,
    to: V2d,
    length: number,
  ): StandingLimb | undefined => {
    const [x, y] = lying(to.sub(from));
    const reach = Math.hypot(x, y) / length;
    return reach > 1.5
      ? undefined
      : { angle: Math.atan2(Math.abs(y), x), reach };
  };
  const arm = (metrics.upperArm + metrics.forearm) * size;
  const leg = (metrics.lyingThigh + metrics.lyingShin) * size;
  const { hips, feet } = poses;
  return {
    kind,
    force,
    side,
    speed: Math.min(1, remains.velocity.magnitude / FALL_SPEED),
    missing: {
      head: !parts.head,
      leftArm: !parts.leftArm,
      rightArm: !parts.rightArm,
      legs: !parts.legs,
    },
    arms: [
      standing(poses.leftShoulder, poses.leftHand.position, arm),
      standing(poses.rightShoulder, poses.rightHand.position, arm),
    ],
    legs:
      hips && feet
        ? [standing(hips[0], feet[0], leg), standing(hips[1], feet[1], leg)]
        : undefined,
    lying: remains.lyingDown,
  };
}

/**
 * Its legs left where it stood, fallen over, when the top half goes on
 * without them (cut in half, or as a crawler)
 */
export function dropLegs(
  game: Game,
  remains: BodyRemains,
  direction: V2d,
  tint: number = remains.tint ?? 0xffffff,
) {
  if (!remains.legs) {
    return;
  }
  const poses = remains.sprite.getPartPoses();
  const maker = new PartMaker(remains, poses, tint);
  const legs = maker.legs(remains.legs);
  // Waist toward where the rest of it went
  const angle = direction.angle + rNormal(0, 0.3);
  const center = poses.torso.position.sub(
    polarToVec(angle, maker.legsLength * 0.3),
  );
  game.addEntity(
    new Gib({
      display: legs,
      position: center,
      angle,
      velocity: direction.mul(rUniform(0.3, 1)),
      z: 0.4,
      zVelocity: 0.5,
      spin: rNormal(0, 1),
      radius: 0.2,
      bleedTime: 0.6,
      bloodSize: 0.5,
    }),
  );
}

/**
 * Blood thrown from `position`, `drift` meters per second along `direction`.
 * In small bursts, since a big `FleshImpact` makes big blobs.
 */
function spray(
  game: Game,
  position: V2d,
  blobs: number,
  direction: V2d,
  drift: number,
  height: number = 1,
) {
  for (let left = blobs; left > 0; left -= 4) {
    game.addEntity(
      new FleshImpact(position, Math.min(left, 4), direction, height, drift),
    );
  }
}

/** Where the corpse can go on the way to `wanted` without lying in a wall */
function awayFromWalls(game: Game, from: V2d, wanted: V2d): V2d {
  const offset = wanted.sub(from);
  const distance = offset.magnitude;
  if (distance < 0.01) {
    return wanted;
  }
  const direction = offset.normalize();
  const hit = game.world.raycast(
    from,
    from.add(direction.mul(distance + WALL_MARGIN)),
    { collisionMask: CollisionGroups.Walls },
  );
  if (!hit) {
    return wanted;
  }
  return from.add(direction.mul(Math.max(0, hit.distance - WALL_MARGIN)));
}

/** Makes the pieces of a body for flinging, sized like it */
class PartMaker {
  readonly scale: number;
  /** How big it is next to a human */
  readonly size: number;
  readonly armThickness: number;
  readonly legsLength: number;
  private torsoLength: number;

  constructor(
    private remains: BodyRemains,
    private poses: BodyPoses,
    private tint: number,
  ) {
    const size = remains.radius / HUMAN_RADIUS;
    this.size = size;
    this.scale = bodyPixelScale(size);
    this.torsoLength = remains.lying.torso.width * this.scale;
    this.legsLength = remains.legs ? remains.legs.width * this.scale : 0;
    this.armThickness = remains.lying.metrics.armThickness * size;
  }

  private sprite(texture: Texture, scale: number = this.scale): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(scale);
    return sprite;
  }

  private stump(position: V2d, size: number): Sprite {
    const stump = Sprite.from(choose(...BLOB_TEXTURES));
    stump.anchor.set(0.5);
    stump.position.copyFrom(position);
    stump.width = size;
    stump.height = size;
    stump.tint = darken(0xff0000, rUniform(0.3, 0.45));
    return stump;
  }

  private display(...children: Container[]): Container {
    const display = new Container();
    display.addChild(...children);
    display.tint = this.tint;
    return display;
  }

  head(): Container {
    return this.display(
      this.stump(V(-0.08, 0), this.poses.headRadius * 1.2),
      this.sprite(this.remains.lying.head),
    );
  }

  /**
   * An arm and its hand, pointing along +x, torn off at the left, bent at
   * the elbow some way or other
   */
  arm(left: boolean): Container {
    const metrics = this.remains.lying.metrics;
    const length = (metrics.upperArm + metrics.forearm) * this.size;
    const arm = bentArm(
      this.remains.lying,
      this.size,
      this.scale,
      left,
      rSign() * rUniform(0.2, 1.4),
    );
    // Its middle about where the gib's is
    arm.position.set(-length / 2, 0);
    const stump = this.stump(V(-length / 2, 0), this.armThickness * 1.3);
    return this.display(arm, stump);
  }

  /** The top half, torn off at the waist */
  torso(): Container {
    const torso = this.sprite(this.remains.lying.torso);
    return this.display(torso);
  }

  /**
   * Legs, torn off at the waist, lying some way or other, the waist toward
   * +x: in parts, each bent at the knee, when it has them, else straight
   */
  legs(texture: Texture): Container {
    const waist = this.legsLength * 0.45;
    const stump = this.stump(V(waist, 0), this.remains.radius * 1.3);
    const lying = this.remains.lying;
    const pose = lyingPose(
      () => rUniform(0, 1),
      lyingBodyOf(lying.metrics, this.size),
      { ...NO_DEATH, force: rUniform(0.3, 1) },
    );
    const posed = posedLegs(lying, this.size, this.scale, pose.legs, pose.feet);
    if (!posed) {
      return this.display(this.sprite(texture), stump);
    }
    posed.position.set(waist, 0);
    return this.display(posed, stump);
  }

  /** A piece of `display` thrown from `pose`, roughly along `direction` */
  gib(
    display: Container,
    pose: { position: V2d; angle: number },
    direction: V2d,
    spread: number,
    speed: number,
  ): Gib {
    return new Gib({
      display,
      position: pose.position.clone(),
      angle: pose.angle,
      velocity: direction.rotate(rNormal(0, spread)).imul(speed),
      z: rUniform(0.6, 1.2),
      zVelocity: rUniform(1, 4),
      spin: rSign() * rUniform(3, 15),
      radius: 0.1,
      bloodSize: 0.3,
    });
  }

  /** A bit of flesh thrown from `position` */
  chunk(position: V2d, direction: V2d, spread: number, speed: number): Gib {
    const blob = Sprite.from(choose(...BLOB_TEXTURES));
    blob.anchor.set(0.5);
    const size = rUniform(0.06, 0.13);
    blob.width = size;
    blob.height = size * rUniform(0.6, 1);
    blob.tint = darken(0xc02020, rUniform(0.2, 0.5));
    const display = new Container();
    display.addChild(blob);
    display.tint = this.tint;
    return new Gib({
      display,
      position: position.clone(),
      angle: rUniform(0, Math.PI * 2),
      velocity: direction.rotate(rNormal(0, spread)).imul(speed),
      z: rUniform(0.8, 1.5),
      zVelocity: rUniform(0, 4),
      spin: rSign() * rUniform(5, 20),
      radius: size / 2,
      bleedTime: 0.4,
      bloodSize: size * 2,
    });
  }
}
