import { Character } from "./Character";

export const Clyde: Character = {
  name: "Clyde",
  textures: {
    head: "mikeHead",
    leftArm: "mikeLeftArm",
    leftHand: "mikeLeftHand",
    rightArm: "mikeRightArm",
    rightHand: "mikeRightHand",
    torso: "mikeTorso",
  },

  sounds: {
    death: ["clydeDeath1"],
    hurt: ["clydeHurt1", "clydeHurt2"],
    joinParty: ["clydeJoinParty1"],
    lookHere: ["clydeLookHere1", "clydeLookHere2"],
    misc: ["clydeMisc1"],
    nearDeath: ["clydeNearDeath"],
    newLevel: [
      "clydeNewLevel1",
      "clydeNewLevel2",
      "clydeNewLevel3",
      "clydeNewLevel4",
    ],
    pickupItem: ["clydePickup1"],
    pickupGun: ["clydePickup1"],
    pickupMelee: ["clydePickup1"],
    pickupHealth: ["clydePickup1"],
    relief: ["clydeRelief1", "clydeRelief2", "clydeRelief3"],
    taunts: ["clydeTaunt1", "clydeTaunt2"],
    worried: [
      "clydeWorried1",
      "clydeWorried2",
      "clydeWorried3",
      "clydeWorried4",
    ],
  },
};
