import { ImageName, SoundName } from "../../../../resources/resources";
import {
  Animation,
  AnimationFrame,
} from "../../../core/animation/AnimationPlayer";
import {
  sampleNumber,
  sampleStep,
  sampleVec,
  segmentAt,
  Track,
} from "../../../core/animation/Track";
import { lerp } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import type { GunSoundName, GunStats } from "./GunStats";

// How a human holds a gun. Everything about the gun is in its own frame:
// meters from the middle of its holding image, x toward the muzzle and y to
// the holder's right, so it's the same whatever the gun is doing. The pose
// (`poseGun`) puts the gun in the holder's frame (x forward, y right, from
// the middle of the body) by building its transform from parts (where it's
// held, the animation playing, recoil, a wall in the way, a push), then puts
// the hands where they're told to be: on points of the gun, which follow it
// wherever it goes, or at places on the body.

/** Places on a gun, in its own frame (see `GunPoints`) */
export type GunPointName = "grip" | "foregrip" | "magazine" | "action";

/** Where things are on a gun, in its own frame: meters from the middle of its image, x toward the muzzle */
export type GunPoints = { readonly [name in GunPointName]: Point };

type Point = readonly [number, number];

/** Where a hand goes */
export type HandTarget =
  /** On that point of the gun */
  | GunPointName
  /** Near a point on the gun: `offset` from it, in the gun's frame */
  | { readonly gun: GunPointName; readonly offset: Point }
  /** At a place in the holder's frame (x forward, y right): a pocket, a belt */
  | { readonly body: Point };

/** Where the magazine (or the round being loaded) is: in the gun, where it can't be seen, in the left hand, or nowhere */
export type MagazinePlace = "gun" | "hand" | "none";

/** What a gun animation moves. Anything left out stays at rest. */
export interface GunTracks {
  /** Moves the gun, in meters in the holder's frame */
  readonly gunOffset?: Track<Point>;
  /** Turns the gun about its grip, in radians: positive is clockwise on screen, toward the holder's right */
  readonly gunAngle?: Track<number>;
  /** At rest, the left hand is on the foregrip and the right on the grip */
  readonly leftHand?: Track<HandTarget>;
  readonly rightHand?: Track<HandTarget>;
  /** Where the magazine is (it doesn't move between places, so keyframes are steps) */
  readonly magazine?: Track<MagazinePlace>;
  /** Turns the magazine in the hand, in radians from along the gun */
  readonly magazineAngle?: Track<number>;
  /** Whether the left hand and arm are drawn over the gun rather than under it (keyframes are steps) */
  readonly leftHandOver?: Track<boolean>;
}

/** Something that happens at a time in a gun animation */
export type GunEvent =
  /** A sound, or part of one: `offset` seconds in, for `duration` seconds */
  | {
      readonly sound: SoundName;
      readonly offset?: number;
      readonly duration?: number;
      readonly gain?: number;
    }
  /** One of the gun's own sounds (`GunStats.sounds`) */
  | { readonly gunSound: GunSoundName }
  /** Lets go of the magazine in the gun, which falls to the floor */
  | { readonly effect: "dropMagazine" };

export type GunAnimation = Animation<GunTracks, GunEvent>;

/** The magazine (or round) a gun's animations show outside it */
export interface MagazineStats {
  readonly texture: ImageName;
  /** Meters long */
  readonly length: number;
}

/** Where everything is, in the holder's frame */
export interface GunPose {
  /** Where the middle of the gun's image is */
  readonly position: V2d;
  /** Which way the gun points */
  readonly angle: number;
  readonly leftHand: V2d;
  readonly rightHand: V2d;
  readonly magazine: {
    readonly place: MagazinePlace;
    readonly position: V2d;
    readonly angle: number;
  };
  readonly leftHandOver: boolean;
}

/** What moves the gun besides its animation, all in the holder's frame */
export interface GunAdjustments {
  /** Meters the gun slides back from a shot */
  readonly recoil: number;
  /** Radians the last shots have turned it */
  readonly kick: number;
  /** Meters a wall pushes it back, then radians it swings it aside (toward the holder's left) */
  readonly wallSlide: number;
  readonly wallTilt: number;
  /** Meters a push shoves the arms forward (or back), and radians it twists the gun */
  readonly push: number;
  readonly twist: number;
}

export const NO_ADJUSTMENTS: GunAdjustments = {
  recoil: 0,
  kick: 0,
  wallSlide: 0,
  wallTilt: 0,
  push: 0,
  twist: 0,
};

/** Where the gun is: its image's middle and which way it points */
class GunTransform {
  constructor(
    readonly position: V2d,
    public angle: number,
  ) {}

  /** A point in the gun's frame, in the holder's */
  toBody(point: Point): V2d {
    return V(point[0], point[1]).irotate(this.angle).iadd(this.position);
  }

  /** Turns the gun by `angle` about `pivot`, a point in its own frame */
  turnAbout(pivot: Point, angle: number) {
    if (angle !== 0) {
      const center = this.toBody(pivot);
      this.position.isub(center).irotate(angle).iadd(center);
      this.angle += angle;
    }
  }
}

/**
 * Where everything is with the gun `frame` of an animation shows (at rest if
 * there's none), moved by `adjust`
 */
export function poseGun(
  stats: GunStats,
  frame: AnimationFrame<GunTracks, GunEvent> | undefined,
  adjust: GunAdjustments,
): GunPose {
  const tracks = frame?.animation.tracks;
  const time = frame?.time ?? 0;
  const { points } = stats;

  const gun = new GunTransform(V(stats.holdPosition), 0);
  // The animation
  if (tracks?.gunAngle) {
    gun.turnAbout(points.grip, sampleNumber(tracks.gunAngle, time));
  }
  if (tracks?.gunOffset) {
    gun.position.iadd(sampleVec(tracks.gunOffset, time));
  }
  // The last shots
  gun.position.x -= adjust.recoil;
  gun.turnAbout(points.grip, adjust.kick);
  // A wall in the way
  gun.position.x -= adjust.wallSlide;
  gun.turnAbout(points.grip, -adjust.wallTilt);
  // Off to the side it's held on
  gun.position.y += stats.sideOffset;
  // A push
  gun.position.x += adjust.push;
  gun.turnAbout(points.grip, adjust.twist);

  const handAt = (target: HandTarget): V2d => {
    if (typeof target === "string") {
      return gun.toBody(points[target]);
    } else if ("gun" in target) {
      const point = points[target.gun];
      return gun.toBody([
        point[0] + target.offset[0],
        point[1] + target.offset[1],
      ]);
    } else {
      return V(target.body[0] + adjust.push, target.body[1]);
    }
  };
  const hand = (track: Track<HandTarget> | undefined, rest: GunPointName) => {
    if (!track) {
      return handAt(rest);
    }
    const { from, to, u } = segmentAt(track, time);
    return u === 0 ? handAt(from) : handAt(from).ilerp(handAt(to), u);
  };
  const leftHand = hand(tracks?.leftHand, "foregrip");
  const rightHand = hand(tracks?.rightHand, "grip");

  const place = tracks?.magazine ? sampleStep(tracks.magazine, time) : "gun";
  const magazineAngle = tracks?.magazineAngle
    ? sampleNumber(tracks.magazineAngle, time)
    : 0;
  return {
    position: gun.position,
    angle: gun.angle,
    leftHand,
    rightHand,
    magazine: {
      place,
      position:
        place === "hand" ? leftHand.clone() : gun.toBody(points.magazine),
      angle: gun.angle + (place === "hand" ? magazineAngle : 0),
    },
    leftHandOver: tracks?.leftHandOver
      ? sampleStep(tracks.leftHandOver, time)
      : false,
  };
}

/** `u` of the way from one pose to another */
export function blendGunPoses(from: GunPose, to: GunPose, u: number): GunPose {
  const near = u < 0.5 ? from : to;
  return {
    position: from.position.lerp(to.position, u),
    angle: lerp(from.angle, to.angle, u),
    leftHand: from.leftHand.lerp(to.leftHand, u),
    rightHand: from.rightHand.lerp(to.rightHand, u),
    magazine: {
      place: near.magazine.place,
      position: from.magazine.position.lerp(to.magazine.position, u),
      angle: lerp(from.magazine.angle, to.magazine.angle, u),
    },
    leftHandOver: near.leftHandOver,
  };
}

/** Where the muzzle is with the gun posed so */
export function muzzleOf(stats: GunStats, pose: GunPose): V2d {
  return V(stats.muzzleLength / 2, 0)
    .irotate(pose.angle)
    .iadd(pose.position);
}
