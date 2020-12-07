import simonDeath1 from "../../../resources/audio/characters/simon/simon-death-1.flac";
import simonHurt1 from "../../../resources/audio/characters/simon/simon-hurt-1.flac";
import simonHurt2 from "../../../resources/audio/characters/simon/simon-hurt-2.flac";
import simonHurt3 from "../../../resources/audio/characters/simon/simon-hurt-3.flac";
import simonHurt4 from "../../../resources/audio/characters/simon/simon-hurt-4.flac";
import simonHurt5 from "../../../resources/audio/characters/simon/simon-hurt-5.flac";
import simonHurt6 from "../../../resources/audio/characters/simon/simon-hurt-6.flac";
import simonHurt7 from "../../../resources/audio/characters/simon/simon-hurt-7.flac";
import simonJoinParty1 from "../../../resources/audio/characters/simon/simon-join-party-1.flac";
import simonLookHere1 from "../../../resources/audio/characters/simon/simon-look-here-1.flac";
import simonLookHere2 from "../../../resources/audio/characters/simon/simon-look-here-2.flac";
import simonNearDeath2 from "../../../resources/audio/characters/simon/simon-near-death-2.flac";
import simonPickupItem1 from "../../../resources/audio/characters/simon/simon-pickup-item-1.flac";
import simonPickupItem2 from "../../../resources/audio/characters/simon/simon-pickup-item-2.flac";
import simonPickupItem3 from "../../../resources/audio/characters/simon/simon-pickup-item-3.flac";
import simonRelief1 from "../../../resources/audio/characters/simon/simon-relief-1.flac";
import simonTaunt1 from "../../../resources/audio/characters/simon/simon-taunt-1.flac";
import simonTaunt2 from "../../../resources/audio/characters/simon/simon-taunt-2.flac";
import simonWorried1 from "../../../resources/audio/characters/simon/simon-worried-1.flac";
import simonWorried2 from "../../../resources/audio/characters/simon/simon-worried-2.flac";
import simonWorried3 from "../../../resources/audio/characters/simon/simon-worried-3.flac";
import simonGun from "../../../resources/images/characters/simon/simon_gun.png";
import simonHold from "../../../resources/images/characters/simon/simon_hold.png";
import simonReload from "../../../resources/images/characters/simon/simon_reload.png";
import simonStand from "../../../resources/images/characters/simon/simon_stand.png";
import { Character } from "./Character";

export const Simon: Character = {
  textures: {
    gun: simonGun,
    stand: simonStand,
    reload: simonReload,
    hold: simonHold,
  },

  sounds: {
    death: [simonDeath1],
    hurt: [
      simonHurt1,
      simonHurt2,
      simonHurt3,
      simonHurt4,
      simonHurt5,
      simonHurt6,
      simonHurt7,
    ],
    joinParty: [simonJoinParty1],
    lookHere: [simonLookHere1, simonLookHere2],
    misc: [], // TODO: simon misc
    nearDeath: [simonNearDeath2],
    newLevel: [], // TODO: simon newLevel
    pickupItem: [simonPickupItem1, simonPickupItem2, simonPickupItem3],
    relief: [simonRelief1],
    taunts: [simonTaunt1, simonTaunt2],
    worried: [simonWorried1, simonWorried2, simonWorried3],
  },
};
