import { Character } from "./Character";

export const Clarice: Character = {
  textures: {
    head: "clariceHead",
    leftArm: "clariceLeftArm",
    leftHand: "clariceLeftHand",
    rightArm: "clariceRightArm",
    rightHand: "clariceRightHand",
    torso: "clariceTorso",
  },

  sounds: {
    death: ["clariceDeath1", "clariceDeath2"],
    hurt: ["clariceHurt1", "clariceHurt2", "clariceHurt3"],
    joinParty: ["clariceJoinParty1"],
    lookHere: ["clariceLookHere1"],
    misc: ["clariceMisc1", "clariceMisc2"],
    nearDeath: ["clariceNearDeath"],
    newLevel: ["clariceNewLevel1"],
    pickupItem: ["claricePickup1"],
    pickupGun: ["claricePickup1"],
    pickupMelee: ["claricePickup1"],
    pickupHealth: ["claricePickup1"],
    relief: ["clariceRelief1", "clariceRelief2"],
    taunts: ["clariceTaunt1"],
    worried: ["clariceWorried1"],
  },
};
