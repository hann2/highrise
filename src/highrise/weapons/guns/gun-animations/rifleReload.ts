import { SoundName } from "../../../../../resources/resources";
import { TimedEvent } from "../../../../core/animation/AnimationPlayer";
import { Keyframe } from "../../../../core/animation/Track";
import type { GunAnimations } from "../GunStats";
import { GunAnimation, GunEvent, HandTarget } from "../GunPose";

// A rifle's magazine change, timed to the AR-15's reload recordings (which
// the AK-47 and P90 use too). Authored at the AR-15's 1.7 seconds, and
// stretched to the gun's. The recording is played a piece at a time, each
// piece on the motion it's the sound of, so they stay together however the
// reload's stretched:
//
//   0.05 s  magazine release  ┐
//   0.16    magazine out      ┘ the "out" piece, from 0
//   0.69    magazine in       ┐
//   0.90    slap              ┘ the "in" piece, from 0.6
//   1.30    bolt catch (a full reload), or
//   1.48    charging handle back and 1.65 forward (from empty)
//
// From above, a magazine comes out of the bottom of the gun toward the
// camera, so it's shown coming out the far side of the gun from the body
// (+y in the gun's frame), where it can be seen, and going back in from there.

const DURATION = 1.7;
/** Where the spare magazines are: the left of the belt, under the body, in the holder's frame */
const POUCH: HandTarget = { body: [0.15, -0.12] };
/** Turned so its top faces the gun as it's pulled out and put in */
const MAGAZINE_ANGLE = -Math.PI / 2;
/** The gun's turned and pulled in for the whole thing */
const ANGLE = -0.4;
const PULLED_IN: [number, number] = [-0.1, -0.1];
/** The slap pushes the gun a little this way */
const SLAPPED: [number, number] = [-0.09, -0.115];
/** Racking the charging handle, the gun comes forward and across, so the left arm reaches it in front of the face */
const RACK_ANGLE = -0.6;
const RACKED: [number, number] = [0, -0.16];

/** Near the magazine well: `out` meters out from it, and `along` toward the muzzle */
const atMagazine = (out: number, along = 0): HandTarget => ({
  gun: "magazine",
  offset: [along, out],
});

interface RifleOptions {
  /** The P90's magazine lies on top of the gun, so the hand works over it */
  magazineOnTop?: boolean;
}

interface Ending {
  name: string;
  /** The reload recording */
  sound: SoundName;
  /** The left hand after the slap (1.15 s), until it's back on the foregrip at `handBack` */
  afterSlap: Keyframe<HandTarget>[];
  handBack: number;
  /** Bring the gun forward and across to rack the charging handle, from 1.25 s to 1.55, with the hand over the gun */
  rack?: boolean;
  events: TimedEvent<GunEvent>[];
}

function rifleReload(
  { magazineOnTop = false }: RifleOptions,
  { name, sound, afterSlap, handBack, rack = false, events }: Ending,
): GunAnimation {
  const end = DURATION;
  return {
    name,
    duration: end,
    tracks: {
      gunAngle: [
        { t: 0, v: 0 },
        { t: 0.22, v: ANGLE },
        ...(rack
          ? [
              { t: 1.2, v: ANGLE },
              { t: 1.3, v: RACK_ANGLE },
              { t: 1.5, v: RACK_ANGLE },
            ]
          : [{ t: end - 0.25, v: ANGLE }]),
        { t: end, v: 0 },
      ],
      gunOffset: [
        { t: 0, v: [0, 0] },
        { t: 0.22, v: PULLED_IN },
        { t: 1.1, v: PULLED_IN },
        { t: 1.16, v: SLAPPED, ease: "in" },
        ...(rack
          ? [
              { t: 1.3, v: RACKED },
              { t: 1.5, v: RACKED },
            ]
          : [
              { t: 1.26, v: PULLED_IN },
              { t: end - 0.25, v: PULLED_IN },
            ]),
        { t: end, v: [0, 0] },
      ],
      leftHand: [
        { t: 0, v: "foregrip" },
        // Takes hold of the magazine, releases it, and pulls it out
        { t: 0.2, v: atMagazine(0.03, 0.02) },
        { t: 0.26, v: atMagazine(0.03, 0.02) },
        { t: 0.42, v: atMagazine(0.22, -0.03), ease: "out" },
        // Lets it fall on the way to the pouch for a fresh one
        { t: 0.66, v: POUCH },
        { t: 0.7, v: POUCH },
        // Back under the gun, and in
        { t: 0.88, v: atMagazine(0.13, -0.02) },
        { t: 0.96, v: atMagazine(0.03), ease: "in" },
        // Back a little, and a slap to seat it
        { t: 1.06, v: atMagazine(0.1, -0.02), ease: "out" },
        { t: 1.15, v: atMagazine(0.02), ease: "in" },
        ...afterSlap,
        { t: handBack, v: "foregrip" },
      ],
      magazine: [
        { t: 0, v: "gun" },
        { t: 0.24, v: "hand" },
        { t: 0.44, v: "none" },
        { t: 0.68, v: "hand" },
        { t: 0.96, v: "gun" },
      ],
      magazineAngle: [{ t: 0, v: magazineOnTop ? 0 : MAGAZINE_ANGLE }],
      leftHandOver: [
        { t: 0, v: false },
        ...(magazineOnTop
          ? [
              { t: 0.15, v: true },
              { t: 0.44, v: false },
              { t: 0.8, v: true },
              { t: 1.2, v: false },
            ]
          : []),
        ...(rack
          ? [
              { t: 1.22, v: true },
              { t: 1.56, v: false },
            ]
          : []),
      ],
    },
    events: [
      { t: 0.15, sound, offset: 0, duration: 0.45 },
      { t: 0.44, effect: "dropMagazine" as const },
      { t: 0.87, sound, offset: 0.6, duration: 0.55 },
      ...events,
    ],
  };
}

export function rifleAnimations(options: RifleOptions = {}): GunAnimations {
  return {
    // A round's still in the chamber: a tap on the bolt catch, and back
    reload: rifleReload(options, {
      name: "rifle reload",
      sound: "ar15Reload1",
      afterSlap: [
        { t: 1.28, v: atMagazine(-0.05, 0.05) },
        { t: 1.33, v: atMagazine(-0.03, 0.06), ease: "in" },
        { t: 1.42, v: atMagazine(-0.08, 0.06) },
      ],
      handBack: 1.62,
      events: [{ t: 1.23, sound: "ar15Reload1", offset: 1.2, duration: 0.65 }],
    }),
    // From empty: over the gun to the charging handle, back, and let go
    reloadEmpty: rifleReload(options, {
      name: "rifle reload from empty",
      sound: "ar15ReloadEmpty",
      afterSlap: [
        { t: 1.3, v: "action" },
        { t: 1.38, v: { gun: "action", offset: [-0.09, 0] }, ease: "in" },
        { t: 1.5, v: { gun: "action", offset: [-0.09, 0] } },
        { t: 1.56, v: { gun: "action", offset: [-0.07, -0.08] }, ease: "out" },
      ],
      handBack: DURATION,
      rack: true,
      events: [
        { t: 1.28, sound: "ar15ReloadEmpty", offset: 1.4, duration: 0.67 },
      ],
    }),
  };
}
