import { Character } from "./Character";

export const Takeshi: Character = {
  name: "Takeshi",
  textures: {
    head: "takeshiHead",
    leftArm: "takeshiLeftArm",
    leftHand: "takeshiLeftHand",
    rightArm: "takeshiRightArm",
    rightHand: "takeshiRightHand",
    torso: "takeshiTorso",
  },

  sounds: {
    death: ["takeshiDeath1"],
    hurt: [
      "takeshiHurt1",
      "takeshiHurt2",
      "takeshiHurt3",
      "takeshiHurt4",
      "takeshiHurt6",
      "takeshiHurt7",
      "takeshiHurt8",
    ],
    joinParty: ["takeshiJoinParty1", "takeshiJoinParty2"],
    lookHere: ["takeshiLookHere1"],
    misc: ["takeshiMisc1"],
    nearDeath: ["takeshiNearDeath1"],
    newLevel: ["takeshiNewLevel1"],
    pickupItem: ["takeshiPickup1", "takeshiPickup2"],
    pickupGun: ["takeshiPickup1", "takeshiPickup2"],
    pickupMelee: ["takeshiPickup1", "takeshiPickup2"],
    pickupHealth: ["takeshiPickup1", "takeshiPickup2"],
    relief: ["takeshiLevelComplete1", "takeshiLevelComplete2"],
    taunts: [
      "takeshiTaunt1",
      "takeshiTaunt2",
      "takeshiTaunt3",
      "takeshiTaunt4",
    ],
    worried: ["takeshiWorried1", "takeshiWorried2", "takeshiWorried3"],
  },
};
