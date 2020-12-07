import cindyDeath1 from "../../../resources/audio/characters/cindy/cindy-death-1.flac";
import cindyHurt1 from "../../../resources/audio/characters/cindy/cindy-hurt-1.flac";
import cindyHurt2 from "../../../resources/audio/characters/cindy/cindy-hurt-2.flac";
import cindyHurt3 from "../../../resources/audio/characters/cindy/cindy-hurt-3.flac";
import cindyJoinParty1 from "../../../resources/audio/characters/cindy/cindy-join-party-1.flac";
import cindyLookHere1 from "../../../resources/audio/characters/cindy/cindy-look-here-1.flac";
import cindyLookHere2 from "../../../resources/audio/characters/cindy/cindy-look-here-2.flac";
import cindyMisc1 from "../../../resources/audio/characters/cindy/cindy-misc-1.flac";
import cindyNearDeath1 from "../../../resources/audio/characters/cindy/cindy-near-death-1.flac";
import cindyNewLevel1 from "../../../resources/audio/characters/cindy/cindy-new-level-1.flac";
import cindyPickup1 from "../../../resources/audio/characters/cindy/cindy-pickup-1.flac";
import cindyRelief1 from "../../../resources/audio/characters/cindy/cindy-relief-1.flac";
import cindyTaunt1 from "../../../resources/audio/characters/cindy/cindy-taunt-1.flac";
import cindyTaunt2 from "../../../resources/audio/characters/cindy/cindy-taunt-2.flac";
import cindyWorried1 from "../../../resources/audio/characters/cindy/cindy-worried-1.flac";
import cindyGun from "../../../resources/images/characters/cindy/cindy_gun.png";
import cindyHold from "../../../resources/images/characters/cindy/cindy_hold.png";
import cindyReload from "../../../resources/images/characters/cindy/cindy_reload.png";
import cindyStand from "../../../resources/images/characters/cindy/cindy_stand.png";
import { Character } from "./Character";

export const Cindy: Character = {
  textures: {
    gun: cindyGun,
    stand: cindyStand,
    reload: cindyReload,
    hold: cindyHold,
  },

  sounds: {
    death: [cindyDeath1],
    hurt: [cindyHurt1, cindyHurt2, cindyHurt3],
    joinParty: [cindyJoinParty1],
    lookHere: [cindyLookHere1, cindyLookHere2],
    misc: [cindyMisc1],
    nearDeath: [cindyNearDeath1],
    newLevel: [cindyNewLevel1],
    pickupItem: [cindyPickup1],
    relief: [cindyRelief1],
    taunts: [cindyTaunt1, cindyTaunt2],
    worried: [cindyWorried1],
  },
};
