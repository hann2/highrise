import snd_luckyJackDeath1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-death-1.flac";
import snd_luckyJackDeath2 from "../../../resources/audio/characters/lucky-jack/lucky-jack-death-2.flac";
import snd_luckyJackHurt1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-1.flac";
import snd_luckyJackHurt2 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-2.flac";
import snd_luckyJackHurt3 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-3.flac";
import snd_luckyJackHurt4 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-4.flac";
import snd_luckyJackHurt6 from "../../../resources/audio/characters/lucky-jack/lucky-jack-hurt-6.flac";
import snd_luckyJackJoinParty1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-join-party-1.flac";
import snd_luckyJackLookHere from "../../../resources/audio/characters/lucky-jack/lucky-jack-look-here.flac";
import snd_luckyJackMisc1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-misc-1.flac";
import snd_luckyJackNearDeath1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-near-death-1.flac";
import snd_luckyJackNewLevel1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-new-level-1.flac";
import snd_luckyJackNewLevel2 from "../../../resources/audio/characters/lucky-jack/lucky-jack-new-level-2.flac";
import snd_luckyJackNewLevel3 from "../../../resources/audio/characters/lucky-jack/lucky-jack-new-level-3.flac";
import snd_luckyJackPickup1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-pickup-1.flac";
import snd_luckyJackRelief1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-relief-1.flac";
import snd_luckyJackTaunt1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-1.flac";
import snd_luckyJackTaunt2 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-2.flac";
import snd_luckyJackTaunt3 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-3.flac";
import snd_luckyJackTaunt4 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-4.flac";
import snd_luckyJackTaunt5 from "../../../resources/audio/characters/lucky-jack/lucky-jack-taunt-5.flac";
import snd_luckyJackWorried1 from "../../../resources/audio/characters/lucky-jack/lucky-jack-worried-1.flac";
import img_luckyJackHead from "../../../resources/images/characters/lucky-jack-head.png";
import img_luckyJackLeftArm from "../../../resources/images/characters/lucky-jack-left-arm.png";
import img_luckyJackLeftHand from "../../../resources/images/characters/lucky-jack-left-hand.png";
import img_luckyJackRightArm from "../../../resources/images/characters/lucky-jack-right-arm.png";
import img_luckyJackRightHand from "../../../resources/images/characters/lucky-jack-right-hand.png";
import img_luckyJackTorso from "../../../resources/images/characters/lucky-jack-torso.png";
import { Character } from "./Character";

export const LuckyJack: Character = {
  textures: {
    head: img_luckyJackHead,
    leftArm: img_luckyJackLeftArm,
    leftHand: img_luckyJackLeftHand,
    rightArm: img_luckyJackRightArm,
    rightHand: img_luckyJackRightHand,
    torso: img_luckyJackTorso,
  },

  sounds: {
    death: [snd_luckyJackDeath1, snd_luckyJackDeath2],
    hurt: [
      snd_luckyJackHurt1,
      snd_luckyJackHurt2,
      snd_luckyJackHurt3,
      snd_luckyJackHurt4,
      snd_luckyJackHurt6,
    ],
    joinParty: [snd_luckyJackJoinParty1],
    lookHere: [snd_luckyJackLookHere],
    misc: [snd_luckyJackMisc1],
    nearDeath: [snd_luckyJackNearDeath1],
    newLevel: [
      snd_luckyJackNewLevel1,
      snd_luckyJackNewLevel2,
      snd_luckyJackNewLevel3,
    ],
    pickupItem: [snd_luckyJackPickup1],
    pickupGun: [snd_luckyJackPickup1],
    pickupMelee: [snd_luckyJackPickup1],
    pickupHealth: [snd_luckyJackPickup1],
    relief: [snd_luckyJackRelief1],
    taunts: [
      snd_luckyJackTaunt1,
      snd_luckyJackTaunt2,
      snd_luckyJackTaunt3,
      snd_luckyJackTaunt4,
      snd_luckyJackTaunt5,
    ],
    worried: [snd_luckyJackWorried1],
  },
};
