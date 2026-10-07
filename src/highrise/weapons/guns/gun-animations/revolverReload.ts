import type { GunAnimations } from "../GunStats";
import { GunAnimation, HandTarget } from "../GunPose";

// A revolver loaded a round at a time: the gun turns up as the cylinder
// swings out (the empty cases fall out as the reload starts), the left hand
// brings rounds from a pocket to the cylinder one at a time, and a flick of
// the wrist shuts it.

/** Where the rounds are: a pocket on the left, under the body, in the holder's frame */
const POCKET: HandTarget = { body: [0.02, -0.2] };
/** The hand waits under the cylinder between rounds */
const AT_CYLINDER: HandTarget = { gun: "magazine", offset: [0, -0.05] };
const ANGLE = -0.5;
const BROUGHT_IN: [number, number] = [-0.12, -0.06];

/** The cylinder swings out. Authored at a quarter of a second; often squeezed into a tenth. */
const reloadStart: GunAnimation = {
  name: "revolver reload start",
  duration: 0.25,
  tracks: {
    gunAngle: [
      { t: 0, v: 0 },
      { t: 0.25, v: ANGLE },
    ],
    gunOffset: [
      { t: 0, v: [0, 0] },
      { t: 0.25, v: BROUGHT_IN },
    ],
    leftHand: [
      { t: 0, v: "foregrip" },
      { t: 0.25, v: AT_CYLINDER },
    ],
    parts: {
      cylinder: [
        { t: 0, v: 0 },
        { t: 0.2, v: 1, ease: "out" },
      ],
    },
  },
  events: [{ t: 0, gunSound: "reload" }],
};

/** A round from the pocket into the cylinder. Authored at the revolver's 0.22 seconds. */
const reloadInsert: GunAnimation = {
  name: "revolver reload round",
  duration: 0.22,
  tracks: {
    gunAngle: [{ t: 0, v: ANGLE }],
    gunOffset: [{ t: 0, v: BROUGHT_IN }],
    leftHand: [
      { t: 0, v: AT_CYLINDER },
      { t: 0.07, v: POCKET },
      { t: 0.15, v: { gun: "magazine", offset: [-0.03, -0.03] } },
      { t: 0.18, v: { gun: "magazine", offset: [0, -0.01] }, ease: "in" },
      { t: 0.22, v: AT_CYLINDER, ease: "out" },
    ],
    magazine: [
      { t: 0, v: "none" },
      { t: 0.07, v: "hand" },
      { t: 0.18, v: "none" },
    ],
    parts: { cylinder: [{ t: 0, v: 1 }] },
  },
  // The recordings' click is about 0.07 s in
  events: [{ t: 0.1, gunSound: "reloadInsert" }],
};

/** A flick to shut the cylinder, and back to aiming. Authored at a fifth of a second; often squeezed into a tenth. */
const reloadFinish: GunAnimation = {
  name: "revolver reload finish",
  duration: 0.2,
  tracks: {
    gunAngle: [
      { t: 0, v: ANGLE },
      { t: 0.06, v: ANGLE - 0.15, ease: "out" },
      { t: 0.2, v: 0 },
    ],
    gunOffset: [
      { t: 0, v: BROUGHT_IN },
      { t: 0.2, v: [0, 0] },
    ],
    leftHand: [
      { t: 0, v: AT_CYLINDER },
      { t: 0.16, v: "foregrip" },
    ],
    // Flicked shut
    parts: {
      cylinder: [
        { t: 0, v: 1 },
        { t: 0.06, v: 0, ease: "in" },
      ],
    },
  },
  // The recording's click is 0.1 s in
  events: [{ t: 0, gunSound: "reloadFinish" }],
};

export const REVOLVER_ANIMATIONS: GunAnimations = {
  reloadStart,
  reloadInsert,
  reloadFinish,
};
