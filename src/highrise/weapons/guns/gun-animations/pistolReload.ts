import { TimedEvent } from "../../../../core/animation/AnimationPlayer";
import { Keyframe } from "../../../../core/animation/Track";
import type { GunAnimations } from "../GunStats";
import { GunAnimation, GunEvent, HandTarget } from "../GunPose";

// A pistol's magazine change, timed to the M1911's reload recording (which
// every pistol uses). Authored at a second, the pistols' reload time. The
// recording is played a piece at a time, each on the motion it's the sound of:
//
//   0.00 s  magazine release, 0.13 it slides out  the "out" piece, from 0
//   0.57    magazine in                           the "in" piece, from 0.5
//   0.73    slide release (from empty)            the "slide" piece, from 0.68

const DURATION = 1;
const SOUND = "m1911Reload1";
/** Where the spare magazines are: a pocket on the left, under the body, in the holder's frame */
const POCKET: HandTarget = { body: [0.02, -0.2] };
/** Turned so its top faces the gun as it's put in */
const MAGAZINE_ANGLE = Math.PI / 2;
/** The gun's turned and brought in for the whole thing */
const ANGLE = -0.35;
const BROUGHT_IN: [number, number] = [-0.1, -0.06];
const SEATED: [number, number] = [-0.09, -0.07];

function pistolReload(
  name: string,
  /** The left hand from when the magazine's in (0.62 s) until it's back on the grip */
  afterInsert: Keyframe<HandTarget>[],
  /** When the left hand goes over the gun, and back under */
  over: [number, number] | undefined,
  events: TimedEvent<GunEvent>[],
  /** Where the slide is, if it's not just forward */
  slide?: Keyframe<number>[],
): GunAnimation {
  return {
    name,
    duration: DURATION,
    tracks: {
      gunAngle: [
        { t: 0, v: 0 },
        { t: 0.14, v: ANGLE },
        { t: 0.8, v: ANGLE },
        { t: DURATION, v: 0 },
      ],
      gunOffset: [
        { t: 0, v: [0, 0] },
        { t: 0.14, v: BROUGHT_IN },
        { t: 0.6, v: BROUGHT_IN },
        { t: 0.64, v: SEATED, ease: "in" },
        { t: 0.7, v: BROUGHT_IN },
        { t: 0.8, v: BROUGHT_IN },
        { t: DURATION, v: [0, 0] },
      ],
      leftHand: [
        { t: 0, v: "foregrip" },
        // Off the grip as the old magazine drops, to the pocket for another
        { t: 0.12, v: { gun: "grip", offset: [-0.02, -0.08] } },
        { t: 0.36, v: POCKET },
        { t: 0.4, v: POCKET },
        // Up under the grip, and in
        { t: 0.53, v: { gun: "magazine", offset: [-0.03, -0.11] } },
        { t: 0.62, v: { gun: "magazine", offset: [0, -0.025] }, ease: "in" },
        ...afterInsert,
      ],
      magazine: [
        { t: 0, v: "gun" },
        { t: 0.1, v: "none" },
        { t: 0.38, v: "hand" },
        { t: 0.62, v: "gun" },
      ],
      magazineAngle: [{ t: 0, v: MAGAZINE_ANGLE }],
      leftHandOver: over
        ? [
            { t: 0, v: false },
            { t: over[0], v: true },
            { t: over[1], v: false },
          ]
        : [{ t: 0, v: false }],
      parts: slide ? { slide } : undefined,
    },
    events: [
      { t: 0, sound: SOUND, offset: 0, duration: 0.45 },
      { t: 0.1, effect: "dropMagazine" },
      { t: 0.55, sound: SOUND, offset: 0.5, duration: 0.18 },
      ...events,
    ],
  };
}

export const PISTOL_ANIMATIONS: GunAnimations = {
  // A round's still in the chamber: back to the grip
  reload: pistolReload(
    "pistol reload",
    [{ t: 0.82, v: "foregrip" }],
    undefined,
    [],
  ),
  // From empty: the slide's locked back, so over the top to take hold of it,
  // tug it, and let it fly forward. The hand's on the slide's grip (`action`,
  // which moves with it)
  reloadEmpty: pistolReload(
    "pistol reload from empty",
    [
      { t: 0.72, v: "action" },
      { t: 0.77, v: { gun: "action", offset: [-0.01, 0] }, ease: "in" },
      { t: 0.84, v: { gun: "action", offset: [-0.07, -0.06] }, ease: "out" },
      { t: 0.96, v: "foregrip" },
    ],
    [0.66, 0.84],
    [{ t: 0.73, sound: SOUND, offset: 0.68, duration: 0.28 }],
    [
      { t: 0, v: 1 },
      { t: 0.77, v: 1 },
      { t: 0.8, v: 0, ease: "in" },
    ],
  ),
};
