import { Character } from "./Character";

export const LuckyJack: Character = {
  name: "Lucky Jack",
  textures: {
    head: "luckyJackHead",
    leftArm: "luckyJackLeftArm",
    leftHand: "luckyJackLeftHand",
    rightArm: "luckyJackRightArm",
    rightHand: "luckyJackRightHand",
    torso: "luckyJackTorso",
  },

  sounds: {
    death: ["luckyJackDeath1", "luckyJackDeath2"],
    hurt: [
      "luckyJackHurt1",
      "luckyJackHurt2",
      "luckyJackHurt3",
      "luckyJackHurt4",
      "luckyJackHurt6",
    ],
    joinParty: ["luckyJackJoinParty1"],
    lookHere: ["luckyJackLookHere"],
    misc: ["luckyJackMisc1"],
    nearDeath: ["luckyJackNearDeath1"],
    newLevel: [
      "luckyJackNewLevel1",
      "luckyJackNewLevel2",
      "luckyJackNewLevel3",
    ],
    pickupItem: ["luckyJackPickup1"],
    pickupGun: ["luckyJackPickup1"],
    pickupMelee: ["luckyJackPickup1"],
    pickupHealth: ["luckyJackPickup1"],
    relief: ["luckyJackRelief1"],
    taunts: [
      "luckyJackTaunt1",
      "luckyJackTaunt2",
      "luckyJackTaunt3",
      "luckyJackTaunt4",
      "luckyJackTaunt5",
    ],
    worried: ["luckyJackWorried1"],
  },
};
