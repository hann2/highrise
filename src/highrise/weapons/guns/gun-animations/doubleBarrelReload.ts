import type { GunAnimations } from "../GunStats";
import { GunAnimation, HandTarget } from "../GunPose";

// The double barrel broken open (the empty shells pop out as the reload
// starts), two shells from the belt into the breech together, and snapped
// shut. Authored at its 1.4 seconds.

const DURATION = 1.4;
/** Where the shells are: the left of the belt, under the body, in the holder's frame */
const SHELLS: HandTarget = { body: [0.12, -0.14] };
const OPEN = -0.45;
const PULLED_IN: [number, number] = [-0.1, -0.08];

const reload: GunAnimation = {
  name: "double barrel reload",
  duration: DURATION,
  tracks: {
    gunAngle: [
      { t: 0, v: 0 },
      { t: 0.2, v: OPEN },
      { t: 1.1, v: OPEN },
      // Snapped shut
      { t: 1.25, v: 0, ease: "overshoot" },
    ],
    gunOffset: [
      { t: 0, v: [0, 0] },
      { t: 0.2, v: PULLED_IN },
      { t: 1.1, v: PULLED_IN },
      { t: 1.3, v: [0, 0] },
    ],
    leftHand: [
      // Holding the fore-end while it breaks open
      { t: 0, v: "foregrip" },
      { t: 0.2, v: "foregrip" },
      { t: 0.45, v: SHELLS },
      { t: 0.5, v: SHELLS },
      // Into the breech
      { t: 0.72, v: { gun: "magazine", offset: [-0.05, -0.06] } },
      { t: 0.8, v: { gun: "magazine", offset: [0, -0.01] }, ease: "in" },
      // Back to the fore-end to shut it
      { t: 1.05, v: "foregrip" },
    ],
    magazine: [
      { t: 0, v: "gun" },
      { t: 0.47, v: "hand" },
      { t: 0.8, v: "gun" },
    ],
  },
  events: [
    // The recording's click is 0.07 s in
    { t: 0.74, gunSound: "reload" },
    // The pump's clack, 0.4 s into its recording
    { t: 1.21, sound: "shotgunPump1", offset: 0.36, duration: 0.2, gain: 0.8 },
  ],
};

export const DOUBLE_BARREL_ANIMATIONS: GunAnimations = { reload };
