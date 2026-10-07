import type { GunAnimations } from "../GunStats";
import { GunAnimation, HandTarget } from "../GunPose";

// A pump shotgun loaded a shell at a time: the gun turns, the left hand
// leaves the pump for the loading port under it and goes between the shells
// on the belt and the port, a shell each time, then works the pump (`PUMP`,
// which plays after a shot too).

/** Where the shells are: the left of the belt, under the body, in the holder's frame */
const SHELLS: HandTarget = { body: [0.15, -0.12] };
/** The hand waits under the loading port between shells */
const AT_PORT: HandTarget = { gun: "magazine", offset: [0, -0.07] };
const ANGLE = -0.35;
const PULLED_IN: [number, number] = [-0.08, -0.08];

/** Turning the gun and taking the hand to the port. Authored at a quarter of a second; often squeezed into a tenth. */
const reloadStart: GunAnimation = {
  name: "shotgun reload start",
  duration: 0.25,
  tracks: {
    gunAngle: [
      { t: 0, v: 0 },
      { t: 0.25, v: ANGLE },
    ],
    gunOffset: [
      { t: 0, v: [0, 0] },
      { t: 0.25, v: PULLED_IN },
    ],
    leftHand: [
      { t: 0, v: "foregrip" },
      { t: 0.25, v: AT_PORT },
    ],
  },
};

/** A shell from the belt, pushed into the port. Authored at the Remington's 0.4 seconds. */
const reloadInsert: GunAnimation = {
  name: "shotgun reload shell",
  duration: 0.4,
  tracks: {
    gunAngle: [{ t: 0, v: ANGLE }],
    gunOffset: [{ t: 0, v: PULLED_IN }],
    leftHand: [
      { t: 0, v: AT_PORT },
      { t: 0.14, v: SHELLS },
      { t: 0.17, v: SHELLS },
      { t: 0.3, v: { gun: "magazine", offset: [-0.03, -0.05] } },
      // Pushed in with the thumb
      { t: 0.35, v: { gun: "magazine", offset: [0.03, -0.01] }, ease: "in" },
      { t: 0.4, v: AT_PORT, ease: "out" },
    ],
    magazine: [
      { t: 0, v: "none" },
      { t: 0.16, v: "hand" },
      { t: 0.35, v: "none" },
    ],
  },
  // The recording's click is 0.07 s in
  events: [{ t: 0.26, gunSound: "reloadInsert" }],
};

/** The left hand slides the pump back and forward (the hand's on the foregrip, which moves with the pump) */
export const PUMP: GunAnimation = {
  name: "pump",
  duration: 0.33,
  tracks: {
    leftHand: [{ t: 0, v: "foregrip" }],
    parts: {
      pump: [
        { t: 0, v: 0 },
        { t: 0.15, v: 1, ease: "linear" },
        { t: 0.2, v: 1 },
        { t: 0.33, v: 0, ease: "linear" },
      ],
    },
  },
  events: [{ t: 0, gunSound: "pump" }],
};

export const SHOTGUN_ANIMATIONS: GunAnimations = {
  reloadStart,
  reloadInsert,
  pump: PUMP,
};
