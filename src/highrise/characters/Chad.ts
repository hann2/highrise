import snd_chadDeath1 from "../../../resources/audio/characters/chad/chad-death-1.flac";
import snd_chadHurt1 from "../../../resources/audio/characters/chad/chad-hurt-1.flac";
import snd_chadHurt2 from "../../../resources/audio/characters/chad/chad-hurt-2.flac";
import snd_chadHurt3 from "../../../resources/audio/characters/chad/chad-hurt-3.flac";
import snd_chadHurt4 from "../../../resources/audio/characters/chad/chad-hurt-4.flac";
import snd_chadHurt5 from "../../../resources/audio/characters/chad/chad-hurt-5.flac";
import snd_chadHurt6 from "../../../resources/audio/characters/chad/chad-hurt-6.flac";
import snd_chadHurt7 from "../../../resources/audio/characters/chad/chad-hurt-7.flac";
import snd_chadJoinParty1 from "../../../resources/audio/characters/chad/chad-join-party-1.flac";
import snd_chadLevelComplete1 from "../../../resources/audio/characters/chad/chad-level-complete-1.flac";
import snd_chadLevelComplete2 from "../../../resources/audio/characters/chad/chad-level-complete-2.flac";
import snd_chadLevelComplete3 from "../../../resources/audio/characters/chad/chad-level-complete-3.flac";
import snd_chadLookHere1 from "../../../resources/audio/characters/chad/chad-look-here-1.flac";
import snd_chadLookHere2 from "../../../resources/audio/characters/chad/chad-look-here-2.flac";
import snd_chadLookHere3 from "../../../resources/audio/characters/chad/chad-look-here-3.flac";
import snd_chadMisc1 from "../../../resources/audio/characters/chad/chad-misc-1.flac";
import snd_chadMisc2 from "../../../resources/audio/characters/chad/chad-misc-2.flac";
import snd_chadNearDeath1 from "../../../resources/audio/characters/chad/chad-near-death-1.flac";
import snd_chadNearDeath2 from "../../../resources/audio/characters/chad/chad-near-death-2.flac";
import snd_chadNewLevel1 from "../../../resources/audio/characters/chad/chad-new-level-1.flac";
import snd_chadNewLevel2 from "../../../resources/audio/characters/chad/chad-new-level-2.flac";
import snd_chadNewLevel3 from "../../../resources/audio/characters/chad/chad-new-level-3.flac";
import snd_chadNewLevel4 from "../../../resources/audio/characters/chad/chad-new-level-4.flac";
import snd_chadPickup1 from "../../../resources/audio/characters/chad/chad-pickup-1.flac";
import snd_chadPickup2 from "../../../resources/audio/characters/chad/chad-pickup-2.flac";
import snd_chadPickup3 from "../../../resources/audio/characters/chad/chad-pickup-3.flac";
import snd_chadTaunt1 from "../../../resources/audio/characters/chad/chad-taunt-1.flac";
import snd_chadTaunt2 from "../../../resources/audio/characters/chad/chad-taunt-2.flac";
import snd_chadTaunt3 from "../../../resources/audio/characters/chad/chad-taunt-3.flac";
import snd_chadTaunt4 from "../../../resources/audio/characters/chad/chad-taunt-4.flac";
import snd_chadTaunt5 from "../../../resources/audio/characters/chad/chad-taunt-5.flac";
import snd_chadTaunt6 from "../../../resources/audio/characters/chad/chad-taunt-6.flac";
import snd_chadWorried1 from "../../../resources/audio/characters/chad/chad-worried-1.flac";
import snd_chadWorried2 from "../../../resources/audio/characters/chad/chad-worried-2.flac";
import snd_chadWorried3 from "../../../resources/audio/characters/chad/chad-worried-3.flac";
import img_chadHead from "../../../resources/images/characters/chad-head.png";
import img_chadLeftArm from "../../../resources/images/characters/chad-left-arm.png";
import img_chadLeftHand from "../../../resources/images/characters/chad-left-hand.png";
import img_chadRightArm from "../../../resources/images/characters/chad-right-arm.png";
import img_chadRightHand from "../../../resources/images/characters/chad-right-hand.png";
import img_chadTorso from "../../../resources/images/characters/chad-torso.png";
import { Character } from "./Character";

export const Chad: Character = {
  textures: {
    head: img_chadHead,
    leftArm: img_chadLeftArm,
    leftHand: img_chadLeftHand,
    rightArm: img_chadRightArm,
    rightHand: img_chadRightHand,
    torso: img_chadTorso,
  },

  sounds: {
    death: [snd_chadDeath1],
    hurt: [
      snd_chadHurt1,
      snd_chadHurt2,
      snd_chadHurt3,
      snd_chadHurt4,
      snd_chadHurt5,
      snd_chadHurt6,
      snd_chadHurt7,
    ],
    joinParty: [snd_chadJoinParty1],
    lookHere: [snd_chadLookHere1, snd_chadLookHere2, snd_chadLookHere3],
    misc: [snd_chadMisc1, snd_chadMisc2],
    nearDeath: [snd_chadNearDeath1, snd_chadNearDeath2],
    newLevel: [
      snd_chadNewLevel1,
      snd_chadNewLevel2,
      snd_chadNewLevel3,
      snd_chadNewLevel4,
    ],
    pickupItem: [snd_chadPickup1, snd_chadPickup2, snd_chadPickup3],
    pickupGun: [snd_chadPickup1, snd_chadPickup2, snd_chadPickup3],
    pickupMelee: [snd_chadPickup1, snd_chadPickup2, snd_chadPickup3],
    pickupHealth: [snd_chadPickup1, snd_chadPickup2, snd_chadPickup3],
    relief: [
      snd_chadLevelComplete1,
      snd_chadLevelComplete2,
      snd_chadLevelComplete3,
    ],
    taunts: [
      snd_chadTaunt1,
      snd_chadTaunt2,
      snd_chadTaunt3,
      snd_chadTaunt4,
      snd_chadTaunt5,
      snd_chadTaunt6,
    ],
    worried: [snd_chadWorried1, snd_chadWorried2, snd_chadWorried3],
  },
};
