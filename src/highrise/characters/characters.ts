import cindyGun from "../../../resources/images/characters/cindy/cindy_gun.png";
import cindyHold from "../../../resources/images/characters/cindy/cindy_hold.png";
import cindyReload from "../../../resources/images/characters/cindy/cindy_reload.png";
import cindyStand from "../../../resources/images/characters/cindy/cindy_stand.png";
import clariceGun from "../../../resources/images/characters/clarice/clarice_gun.png";
import clariceHold from "../../../resources/images/characters/clarice/clarice_hold.png";
import clariceReload from "../../../resources/images/characters/clarice/clarice_reload.png";
import clariceStand from "../../../resources/images/characters/clarice/clarice_stand.png";
import clydeGun from "../../../resources/images/characters/clyde/clyde_gun.png";
import clydeHold from "../../../resources/images/characters/clyde/clyde_hold.png";
import clydeReload from "../../../resources/images/characters/clyde/clyde_reload.png";
import clydeStand from "../../../resources/images/characters/clyde/clyde_stand.png";
import kyleGun from "../../../resources/images/characters/kyle/kyle_gun.png";
import kyleHold from "../../../resources/images/characters/kyle/kyle_hold.png";
import kyleReload from "../../../resources/images/characters/kyle/kyle_reload.png";
import kyleStand from "../../../resources/images/characters/kyle/kyle_stand.png";
import nancyGun from "../../../resources/images/characters/nancy/nancy_gun.png";
import nancyHold from "../../../resources/images/characters/nancy/nancy_hold.png";
import nancyReload from "../../../resources/images/characters/nancy/nancy_reload.png";
import nancyStand from "../../../resources/images/characters/nancy/nancy_stand.png";
import simonGun from "../../../resources/images/characters/simon/simon_gun.png";
import simonHold from "../../../resources/images/characters/simon/simon_hold.png";
import simonReload from "../../../resources/images/characters/simon/simon_reload.png";
import simonStand from "../../../resources/images/characters/simon/simon_stand.png";
import { choose, shuffle } from "../../core/util/Random";
import { Character } from "./Character";

export const Cindy: Character = {
  imageGun: cindyGun,
  imageStand: cindyStand,
  imageReload: cindyReload,
  imageHold: cindyHold,

  sounds: {
    death: ["cindyDeath1"],
    hurt: ["cindyHurt1", "cindyHurt2", "cindyHurt3"],
    joinParty: ["cindyJoinParty1"],
    lookHere: ["cindyLookHere1", "cindyLookHere2"],
    misc: ["cindyMisc1"],
    nearDeath: ["cindyNearDeath1"],
    newLevel: ["cindyNewLevel1"],
    pickupItem: ["cindyPickup1"],
    relief: ["cindyRelief1"],
    taunts: ["cindyTaunt1", "cindyTaunt2"],
    worried: ["cindyWorried1"],
  },
};

export const Clarice: Character = {
  imageGun: clariceGun,
  imageStand: clariceStand,
  imageReload: clariceReload,
  imageHold: clariceHold,

  sounds: {
    death: ["clariceDeath1", "clariceDeath2"],
    hurt: ["clariceHurt1", "clariceHurt2", "clariceHurt3"],
    joinParty: ["clariceJoinParty1"],
    lookHere: ["clariceLookHere1"],
    misc: ["clariceMisc1", "clariceMisc2"],
    nearDeath: ["clariceNearDeath"],
    newLevel: ["clariceNewLevel1"],
    pickupItem: ["claricePickup1"],
    relief: ["clariceRelief1", "clariceRelief2"],
    taunts: ["clariceTaunt1"],
    worried: ["clariceWorried1"],
  },
};

export const Clyde: Character = {
  imageGun: clydeGun,
  imageStand: clydeStand,
  imageReload: clydeReload,
  imageHold: clydeHold,

  sounds: {
    death: ["clydeDeath1"],
    hurt: ["clydeHurt1", "clydeHurt2"],
    joinParty: ["clydeJoinParty1"],
    lookHere: ["clydeLookHere1", "clydeLookHere2"],
    misc: ["clydeMisc1", "clydeMisc1"],
    nearDeath: ["clydeNearDeath"],
    newLevel: [
      "clydeNewLevel1",
      "clydeNewLevel2",
      "clydeNewLevel3",
      "clydeNewLevel4",
    ],
    pickupItem: ["clydePickup1"],
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

export const Kyle: Character = {
  imageGun: kyleGun,
  imageStand: kyleStand,
  imageReload: kyleReload,
  imageHold: kyleHold,

  sounds: {
    death: ["kyleDeath1", "kyleDeath2", "kyleDeath3"],
    hurt: [
      "kyleHurt1",
      "kyleHurt2",
      "kyleHurt3",
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
    relief: ["kyleRelief1"],
    taunts: ["kyleTaunt1"],
    worried: ["kyleWorried1", "kyleWorried2", "kyleWorried3"],
  },
};

export const Nancy: Character = {
  imageGun: nancyGun,
  imageStand: nancyStand,
  imageReload: nancyReload,
  imageHold: nancyHold,

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
    pickupItem: ["nancyPickup1", "nancyPickup2", "nancyPickup3"],
    relief: ["nancyRelief1", "nancyRelief2", "nancyRelief3"],
    taunts: [], // TODO: Find nancy taunt
    worried: ["nancyWorried1", "nancyWorried2", "nancyWorried3"],
  },
};

export const Simon: Character = {
  imageGun: simonGun,
  imageStand: simonStand,
  imageReload: simonReload,
  imageHold: simonHold,

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
    misc: [], // TODO: simon misc
    nearDeath: ["simonNearDeath2"],
    newLevel: [], // TODO: simon newLevel
    pickupItem: ["simonPickupItem1", "simonPickupItem2", "simonPickupItem3"],
    relief: ["simonRelief1"],
    taunts: ["simonTaunt1", "simonTaunt2"],
    worried: ["simonWorried1", "simonWorried2", "simonWorried3"],
  },
};

export const CHARACTERS = [Cindy, Clarice, Clyde, Kyle, Nancy, Simon];

export function randomCharacter(): Character {
  return choose(...CHARACTERS);
}

const CHARACTERS_SHUFFLED = shuffle([...CHARACTERS]);
let characterId = 0;
export function getNextCharacter(): Character {
  characterId++;
  return CHARACTERS_SHUFFLED[characterId % CHARACTERS_SHUFFLED.length];
}
