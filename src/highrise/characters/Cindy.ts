import { Character } from "./Character";

export const Cindy: Character = {
  name: "Cindy",
  textures: {
    head: "cindyHead",
    leftArm: "cindyLeftArm",
    leftHand: "cindyLeftHand",
    rightArm: "cindyRightArm",
    rightHand: "cindyRightHand",
    torso: "cindyTorso",
  },

  sounds: {
    death: ["cindyDeath1"],
    hurt: ["cindyHurt1", "cindyHurt2", "cindyHurt3"],
    joinParty: ["cindyJoinParty1"],
    lookHere: ["cindyLookHere1", "cindyLookHere2"],
    misc: ["cindyMisc1"],
    nearDeath: ["cindyNearDeath1"],
    newLevel: ["cindyNewLevel1"],
    pickupItem: ["cindyPickup1"],
    pickupGun: ["cindyPickup1"],
    pickupMelee: ["cindyPickup1"],
    pickupHealth: ["cindyPickup1"],
    relief: ["cindyRelief1"],
    taunts: ["cindyTaunt1", "cindyTaunt2"],
    worried: ["cindyWorried1"],
  },
};
