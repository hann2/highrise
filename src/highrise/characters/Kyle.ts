import { Character } from "./Character";

export const Kyle: Character = {
  textures: {
    head: "kyleHead",
    leftArm: "kyleLeftArm",
    leftHand: "kyleLeftHand",
    rightArm: "kyleRightArm",
    rightHand: "kyleRightHand",
    torso: "kyleTorso",
  },

  sounds: {
    death: ["kyleDeath1", "kyleDeath2", "kyleDeath3"],
    hurt: [
      "kyleHurt1",
      "kyleHurt2",
      // "kyleHurt3",
      "kyleHurt4",
      "kyleHurt5",
      "kyleHurt6",
      "kyleHurt7",
      "kyleHurt8",
      "kyleHurt9",
    ],
    joinParty: ["kyleJoinParty1"],
    lookHere: ["kyleLookHere1", "kyleLookHere2"],
    misc: [],
    nearDeath: ["kyleNearDeath1", "kyleNearDeath2"],
    newLevel: ["kyleNewLevel1"],
    pickupItem: ["kylePickup1", "kylePickup2"],
    pickupGun: ["kylePickup1", "kylePickup2"],
    pickupMelee: ["kylePickup1", "kylePickup2"],
    pickupHealth: ["kylePickup1", "kylePickup2"],
    relief: ["kyleRelief1"],
    taunts: ["kyleTaunt1"],
    worried: ["kyleWorried1", "kyleWorried2", "kyleWorried3"],
  },
};
