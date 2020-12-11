import luckyJackDeath1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-death-1.flac";
import luckyJackHurt1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-1.flac";
import luckyJackHurt2 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-2.flac";
import luckyJackHurt3 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-3.flac";
import luckyJackHurt4 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-4.flac";
import luckyJackHurt6 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-6.flac";
import luckyJackJoinParty1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-join-party-1.flac";
import luckyJackLookHere from "../../../resources/audio/characters/lucky-jack/lucky-jack-look-here.flac";
import luckyJackMisc1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-misc-1.flac";
import luckyJackNearDeath1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-near-death-1.flac";
import luckyJackNewLevel1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-new-level-1.flac";
import luckyJackPickup1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-pickup-1.flac";
import luckyJackRelief1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-relief-1.flac";
import luckyJackTaunt1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-1.flac";
import luckyJackWorried1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-worried-1.flac";
import luckyJackGun from "../../../resources/images/characters/lucky-jack/lucky-jack_gun.png";
import luckyJackHold from "../../../resources/images/characters/lucky-jack/lucky-jack_hold.png";
import luckyJackReload from "../../../resources/images/characters/lucky-jack/lucky-jack_reload.png";
import luckyJackStand from "../../../resources/images/characters/lucky-jack/lucky-jack_stand.png";
import { Character } from "./Character";

export const LuckyJack: Character = {
  textures: {
    gun: luckyJackGun,
    stand: luckyJackStand,
    reload: luckyJackReload,
    hold: luckyJackHold,
  },

  sounds: {
    death: [luckyJackDeath1],
    hurt: [
      luckyJackHurt1,
      luckyJackHurt2,
      luckyJackHurt3,
      luckyJackHurt4,
      luckyJackHurt6,
    ],
    joinParty: [luckyJackJoinParty1],
    lookHere: [luckyJackLookHere],
    misc: [luckyJackMisc1],
    nearDeath: [luckyJackNearDeath1],
    newLevel: [luckyJackNewLevel1],
    pickupItem: [luckyJackPickup1],
    relief: [luckyJackRelief1],
    taunts: [luckyJackTaunt1],
    worried: [luckyJackWorried1],
  },
};
