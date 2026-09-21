import { Character } from "./Character";

export const Santa: Character = {
  textures: {
    head: "santaHead",
    leftArm: "santaLeftArm",
    leftHand: "santaLeftHand",
    rightArm: "santaRightArm",
    rightHand: "santaRightHand",
    torso: "santaTorso",
  },

  sounds: {
    death: ["santaDeath1"],
    hurt: [
      "santaHurt1",
      "santaHurt2",
      "santaHurt3",
      "santaHurt4",
      "santaHurt5",
      "santaHurt6",
      "santaHurt7",
      "santaHurt8",
    ],
    joinParty: ["santaJoin1"],
    lookHere: ["santaHoHoHo3"],
    misc: [],
    nearDeath: [], // TODO: Santa near death
    newLevel: ["santaNewLevel1", "santaNewLevel2"],
    pickupItem: ["santaPickup2", "santaHoHoHo1", "santaHoHoHo2"],
    pickupGun: ["santaPickupGun1"],
    pickupMelee: ["santaPickup2", "santaHoHoHo1", "santaHoHoHo2"],
    pickupHealth: ["santaHoHoHo1", "santaHoHoHo2"],
    relief: [],
    taunts: [
      "santaTaunt1",
      "santaTaunt2",
      "santaTaunt3",
      "santaTaunt4",
      "santaTaunt5",
      "santaTaunt6",
      "santaTaunt7",
    ],
    worried: ["santaWorried1", "santaWorried2"],
  },
};
