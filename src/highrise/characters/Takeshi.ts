import snd_takeshiDeath1 from "../../../resources/audio/characters/takeshi/takeshi-death-1.flac";
import snd_takeshiHurt1 from "../../../resources/audio/characters/takeshi/takeshi-hurt-1.flac";
import snd_takeshiHurt2 from "../../../resources/audio/characters/takeshi/takeshi-hurt-2.flac";
import snd_takeshiHurt3 from "../../../resources/audio/characters/takeshi/takeshi-hurt-3.flac";
import snd_takeshiHurt4 from "../../../resources/audio/characters/takeshi/takeshi-hurt-4.flac";
import snd_takeshiHurt6 from "../../../resources/audio/characters/takeshi/takeshi-hurt-6.flac";
import snd_takeshiHurt7 from "../../../resources/audio/characters/takeshi/takeshi-hurt-7.flac";
import snd_takeshiHurt8 from "../../../resources/audio/characters/takeshi/takeshi-hurt-8.flac";
import snd_takeshiJoinParty1 from "../../../resources/audio/characters/takeshi/takeshi-join-party-1.flac";
import snd_takeshiJoinParty2 from "../../../resources/audio/characters/takeshi/takeshi-join-party-2.flac";
import snd_takeshiLevelComplete1 from "../../../resources/audio/characters/takeshi/takeshi-level-complete-1.flac";
import snd_takeshiLevelComplete2 from "../../../resources/audio/characters/takeshi/takeshi-level-complete-2.flac";
import snd_takeshiLookHere1 from "../../../resources/audio/characters/takeshi/takeshi-look-here-1.flac";
import snd_takeshiMisc1 from "../../../resources/audio/characters/takeshi/takeshi-misc-1.flac";
import snd_takeshiNearDeath1 from "../../../resources/audio/characters/takeshi/takeshi-near-death-1.flac";
import snd_takeshiNewLevel1 from "../../../resources/audio/characters/takeshi/takeshi-new-level-1.flac";
import snd_takeshiPickup1 from "../../../resources/audio/characters/takeshi/takeshi-pickup-1.flac";
import snd_takeshiPickup2 from "../../../resources/audio/characters/takeshi/takeshi-pickup-2.flac";
import snd_takeshiTaunt1 from "../../../resources/audio/characters/takeshi/takeshi-taunt-1.flac";
import snd_takeshiTaunt2 from "../../../resources/audio/characters/takeshi/takeshi-taunt-2.flac";
import snd_takeshiTaunt3 from "../../../resources/audio/characters/takeshi/takeshi-taunt-3.flac";
import snd_takeshiTaunt4 from "../../../resources/audio/characters/takeshi/takeshi-taunt-4.flac";
import snd_takeshiWorried1 from "../../../resources/audio/characters/takeshi/takeshi-worried-1.flac";
import snd_takeshiWorried2 from "../../../resources/audio/characters/takeshi/takeshi-worried-2.flac";
import snd_takeshiWorried3 from "../../../resources/audio/characters/takeshi/takeshi-worried-3.flac";
import img_takeshiHead from "../../../resources/images/characters/takeshi-head.png";
import img_takeshiLeftArm from "../../../resources/images/characters/takeshi-left-arm.png";
import img_takeshiLeftHand from "../../../resources/images/characters/takeshi-left-hand.png";
import img_takeshiRightArm from "../../../resources/images/characters/takeshi-right-arm.png";
import img_takeshiRightHand from "../../../resources/images/characters/takeshi-right-hand.png";
import img_takeshiTorso from "../../../resources/images/characters/takeshi-torso.png";
import { Character } from "./Character";

export const Takeshi: Character = {
  textures: {
    head: img_takeshiHead,
    leftArm: img_takeshiLeftArm,
    leftHand: img_takeshiLeftHand,
    rightArm: img_takeshiRightArm,
    rightHand: img_takeshiRightHand,
    torso: img_takeshiTorso,
  },

  sounds: {
    death: [snd_takeshiDeath1],
    hurt: [
      snd_takeshiHurt1,
      snd_takeshiHurt2,
      snd_takeshiHurt3,
      snd_takeshiHurt4,
      snd_takeshiHurt6,
      snd_takeshiHurt7,
      snd_takeshiHurt8,
    ],
    joinParty: [snd_takeshiJoinParty1, snd_takeshiJoinParty2],
    lookHere: [snd_takeshiLookHere1],
    misc: [snd_takeshiMisc1],
    nearDeath: [snd_takeshiNearDeath1],
    newLevel: [snd_takeshiNewLevel1],
    pickupItem: [snd_takeshiPickup1, snd_takeshiPickup2],
    pickupGun: [snd_takeshiPickup1, snd_takeshiPickup2],
    pickupMelee: [snd_takeshiPickup1, snd_takeshiPickup2],
    pickupHealth: [snd_takeshiPickup1, snd_takeshiPickup2],
    relief: [snd_takeshiLevelComplete1, snd_takeshiLevelComplete2],
    taunts: [
      snd_takeshiTaunt1,
      snd_takeshiTaunt2,
      snd_takeshiTaunt3,
      snd_takeshiTaunt4,
    ],
    worried: [snd_takeshiWorried1, snd_takeshiWorried2, snd_takeshiWorried3],
  },
};
