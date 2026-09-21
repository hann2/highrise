import { Character } from "./Character";

export const Simon: Character = {
  textures: {
    head: "simonHead",
    leftArm: "simonLeftArm",
    leftHand: "simonLeftHand",
    rightArm: "simonRightArm",
    rightHand: "simonRightHand",
    torso: "simonTorso",
  },

  sounds: {
    death: ["simonDeath1"],
    hurt: [
      "simonHurt1",
      "simonHurt2",
      "simonHurt3",
      "simonHurt4",
      "simonHurt5",
      "simonHurt6",
      "simonHurt7",
    ],
    joinParty: ["simonJoinParty1"],
    lookHere: ["simonLookHere1", "simonLookHere2"],
    misc: [], // TODO: snd_simon misc
    nearDeath: ["simonNearDeath2"],
    newLevel: [], // TODO: snd_simon newLevel
    pickupItem: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    pickupGun: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    pickupMelee: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    pickupHealth: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    relief: ["simonRelief1"],
    taunts: ["simonTaunt1", "simonTaunt2"],
    worried: ["simonWorried1", "simonWorried2", "simonWorried3"],
  },
};
