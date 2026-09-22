import { Character } from "./Character";

export const Nancy: Character = {
  name: "Nancy",
  textures: {
    head: "nancyHead",
    leftArm: "nancyLeftArm",
    leftHand: "nancyLeftHand",
    rightArm: "nancyRightArm",
    rightHand: "nancyRightHand",
    torso: "nancyTorso",
  },

  sounds: {
    death: ["nancyDeath3"],
    hurt: [
      "nancyHurt1",
      "nancyHurt2",
      "nancyHurt3",
      "nancyHurt4",
      "nancyHurt5",
      "nancyHurt6",
    ],
    joinParty: [
      "nancyJoinParty1",
      "nancyJoinParty2",
      "nancyJoinParty3",
      "nancyHurt4",
    ],
    lookHere: ["nancyLookHere1", "nancyLookHere2", "nancyLookHere3"],
    misc: ["nancyMisc1", "nancyMisc2"],
    nearDeath: ["nancyNearDeath1", "nancyNearDeath2"],
    newLevel: ["nancyNewLevel3"],
    pickupItem: ["nancyPickup1", "nancyPickup2"],
    pickupGun: ["nancyPickup1", "nancyPickup2"],
    pickupMelee: ["nancyPickup1", "nancyPickup2"],
    pickupHealth: ["nancyPickup1", "nancyPickup2"],
    relief: ["nancyRelief1", "nancyRelief2", "nancyRelief3"],
    taunts: ["nancyTaunt1", "nancyTaunt2"],
    worried: ["nancyWorried1", "nancyWorried2", "nancyWorried3"],
  },
};
