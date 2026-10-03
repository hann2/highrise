import { degToRad } from "../../../../core/util/MathUtil";
import type { GunAnimations } from "../GunStats";
import { GunAnimation } from "../GunPose";
import { PUMP } from "./shotgunReload";

// The simplest reload, the one every gun had before they had their own: the
// gun tilts up and comes in a little while it's reloaded, and back, with the
// gun's reload sounds. For guns without anything better.

const TILT = degToRad(-30);
const PULL_IN: [number, number] = [-0.05, 0];

/** The whole reload, with a tenth of a second each end to tilt */
const reload: GunAnimation = {
  name: "tilt reload",
  duration: 1.7,
  tracks: {
    gunAngle: [
      { t: 0, v: 0 },
      { t: 0.1, v: TILT },
      { t: 1.6, v: TILT },
      { t: 1.7, v: 0 },
    ],
    gunOffset: [
      { t: 0, v: [0, 0] },
      { t: 0.1, v: PULL_IN },
      { t: 1.6, v: PULL_IN },
      { t: 1.7, v: [0, 0] },
    ],
  },
  events: [{ t: 0, gunSound: "reload" }],
};

const reloadStart: GunAnimation = {
  name: "tilt reload start",
  duration: 0.1,
  tracks: {
    gunAngle: [
      { t: 0, v: 0 },
      { t: 0.1, v: TILT },
    ],
    gunOffset: [
      { t: 0, v: [0, 0] },
      { t: 0.1, v: PULL_IN },
    ],
  },
  events: [{ t: 0, gunSound: "reload" }],
};

const reloadInsert: GunAnimation = {
  name: "tilt reload insert",
  duration: 0.1,
  tracks: {
    gunAngle: [{ t: 0, v: TILT }],
    gunOffset: [{ t: 0, v: PULL_IN }],
  },
  events: [{ t: 0, gunSound: "reloadInsert" }],
};

const reloadFinish: GunAnimation = {
  name: "tilt reload finish",
  duration: 0.1,
  tracks: {
    gunAngle: [
      { t: 0, v: TILT },
      { t: 0.1, v: 0 },
    ],
    gunOffset: [
      { t: 0, v: PULL_IN },
      { t: 0.1, v: [0, 0] },
    ],
  },
  events: [{ t: 0, gunSound: "reloadFinish" }],
};

export const TILT_ANIMATIONS: GunAnimations = {
  reload,
  reloadStart,
  reloadInsert,
  reloadFinish,
  pump: PUMP,
};
