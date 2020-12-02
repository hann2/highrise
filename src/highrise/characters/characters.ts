import manBlueGun from "../../../resources/images/Man Blue/manBlue_gun.png";
import { Character } from "./Character";
import { choose } from "../../core/util/Random";

export const simon: Character = {
  image: manBlueGun,

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
    nearDeath: ["simonNearDeath2"],
    pickupItem: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    relief: ["simonRelief1"],
    taunts: ["simonTaunt1", "simonTaunt2"],
    worried: ["simonWorried1", "simonWorried2", "simonWorried3"],
  },
};

export const characters = [simon];

export function randomCharacter(): Character {
  return choose(...characters);
}
