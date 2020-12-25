import img_santaHead from "../../../resources/images/characters/santa-head.png";
import img_santaLeftArm from "../../../resources/images/characters/santa-left-arm.png";
import img_santaLeftHand from "../../../resources/images/characters/santa-left-hand.png";
import img_santaRightArm from "../../../resources/images/characters/santa-right-arm.png";
import img_santaRightHand from "../../../resources/images/characters/santa-right-hand.png";
import img_santaTorso from "../../../resources/images/characters/santa-torso.png";
import { Character } from "./Character";

export const Santa: Character = {
  textures: {
    head: img_santaHead,
    leftArm: img_santaLeftArm,
    leftHand: img_santaLeftHand,
    rightArm: img_santaRightArm,
    rightHand: img_santaRightHand,
    torso: img_santaTorso,
  },

  sounds: {
    death: [],
    hurt: [],
    joinParty: [],
    lookHere: [],
    misc: [],
    nearDeath: [],
    newLevel: [],
    pickupItem: [],
    pickupGun: [],
    pickupMelee: [],
    pickupHealth: [],
    relief: [],
    taunts: [],
    worried: [],
  },
};
