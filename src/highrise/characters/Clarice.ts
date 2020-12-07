import clariceDeath1 from "../../../resources/audio/characters/clarice/clarice-death-1.flac";
import clariceDeath2 from "../../../resources/audio/characters/clarice/clarice-death-2.flac";
import clariceHurt1 from "../../../resources/audio/characters/clarice/clarice-hurt-1.flac";
import clariceHurt2 from "../../../resources/audio/characters/clarice/clarice-hurt-2.flac";
import clariceHurt3 from "../../../resources/audio/characters/clarice/clarice-hurt-3.flac";
import clariceJoinParty1 from "../../../resources/audio/characters/clarice/clarice-join-party-1.flac";
import clariceLookHere1 from "../../../resources/audio/characters/clarice/clarice-look-here-1.flac";
import clariceMisc1 from "../../../resources/audio/characters/clarice/clarice-misc-1.flac";
import clariceMisc2 from "../../../resources/audio/characters/clarice/clarice-misc-2.flac";
import clariceNearDeath from "../../../resources/audio/characters/clarice/clarice-near-death.flac";
import clariceNewLevel1 from "../../../resources/audio/characters/clarice/clarice-new-level-1.flac";
import claricePickup1 from "../../../resources/audio/characters/clarice/clarice-pickup-1.flac";
import clariceRelief1 from "../../../resources/audio/characters/clarice/clarice-relief-1.flac";
import clariceRelief2 from "../../../resources/audio/characters/clarice/clarice-relief-2.flac";
import clariceTaunt1 from "../../../resources/audio/characters/clarice/clarice-taunt-1.flac";
import clariceWorried1 from "../../../resources/audio/characters/clarice/clarice-worried-1.flac";
import clariceGun from "../../../resources/images/characters/clarice/clarice_gun.png";
import clariceHold from "../../../resources/images/characters/clarice/clarice_hold.png";
import clariceReload from "../../../resources/images/characters/clarice/clarice_reload.png";
import clariceStand from "../../../resources/images/characters/clarice/clarice_stand.png";
import { Character } from "./Character";

export const Clarice: Character = {
  textures: {
    gun: clariceGun,
    stand: clariceStand,
    reload: clariceReload,
    hold: clariceHold,
  },

  sounds: {
    death: [clariceDeath1, clariceDeath2],
    hurt: [clariceHurt1, clariceHurt2, clariceHurt3],
    joinParty: [clariceJoinParty1],
    lookHere: [clariceLookHere1],
    misc: [clariceMisc1, clariceMisc2],
    nearDeath: [clariceNearDeath],
    newLevel: [clariceNewLevel1],
    pickupItem: [claricePickup1],
    relief: [clariceRelief1, clariceRelief2],
    taunts: [clariceTaunt1],
    worried: [clariceWorried1],
  },
};
