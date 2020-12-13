import chadDeath1 from "../../../resources/audio/characters/chad/chad-death-1.flac";
import chadHurt1 from "../../../resources/audio/characters/chad/chad-hurt-1.flac";
import chadHurt2 from "../../../resources/audio/characters/chad/chad-hurt-2.flac";
import chadHurt3 from "../../../resources/audio/characters/chad/chad-hurt-3.flac";
import chadHurt4 from "../../../resources/audio/characters/chad/chad-hurt-4.flac";
import chadHurt5 from "../../../resources/audio/characters/chad/chad-hurt-5.flac";
import chadHurt6 from "../../../resources/audio/characters/chad/chad-hurt-6.flac";
import chadHurt7 from "../../../resources/audio/characters/chad/chad-hurt-7.flac";
import chadJoinParty1 from "../../../resources/audio/characters/chad/chad-join-party-1.flac";
import chadLevelComplete1 from "../../../resources/audio/characters/chad/chad-level-complete-1.flac";
import chadLevelComplete2 from "../../../resources/audio/characters/chad/chad-level-complete-2.flac";
import chadLevelComplete3 from "../../../resources/audio/characters/chad/chad-level-complete-3.flac";
import chadLookHere1 from "../../../resources/audio/characters/chad/chad-look-here-1.flac";
import chadLookHere2 from "../../../resources/audio/characters/chad/chad-look-here-2.flac";
import chadLookHere3 from "../../../resources/audio/characters/chad/chad-look-here-3.flac";
import chadMisc1 from "../../../resources/audio/characters/chad/chad-misc-1.flac";
import chadMisc2 from "../../../resources/audio/characters/chad/chad-misc-2.flac";
import chadNearDeath1 from "../../../resources/audio/characters/chad/chad-near-death-1.flac";
import chadNearDeath2 from "../../../resources/audio/characters/chad/chad-near-death-2.flac";
import chadNewLevel1 from "../../../resources/audio/characters/chad/chad-new-level-1.flac";
import chadNewLevel2 from "../../../resources/audio/characters/chad/chad-new-level-2.flac";
import chadNewLevel3 from "../../../resources/audio/characters/chad/chad-new-level-3.flac";
import chadNewLevel4 from "../../../resources/audio/characters/chad/chad-new-level-4.flac";
import chadPickup1 from "../../../resources/audio/characters/chad/chad-pickup-1.flac";
import chadPickup2 from "../../../resources/audio/characters/chad/chad-pickup-2.flac";
import chadPickup3 from "../../../resources/audio/characters/chad/chad-pickup-3.flac";
import chadTaunt1 from "../../../resources/audio/characters/chad/chad-taunt-1.flac";
import chadTaunt2 from "../../../resources/audio/characters/chad/chad-taunt-2.flac";
import chadTaunt3 from "../../../resources/audio/characters/chad/chad-taunt-3.flac";
import chadTaunt4 from "../../../resources/audio/characters/chad/chad-taunt-4.flac";
import chadTaunt5 from "../../../resources/audio/characters/chad/chad-taunt-5.flac";
import chadTaunt6 from "../../../resources/audio/characters/chad/chad-taunt-6.flac";
import chadWorried1 from "../../../resources/audio/characters/chad/chad-worried-1.flac";
import chadWorried2 from "../../../resources/audio/characters/chad/chad-worried-2.flac";
import chadWorried3 from "../../../resources/audio/characters/chad/chad-worried-3.flac";
import chadHead from "../../../resources/images/characters/chad-head.png";
import chadLeftArm from "../../../resources/images/characters/chad-left-arm.png";
import chadLeftHand from "../../../resources/images/characters/chad-left-hand.png";
import chadRightArm from "../../../resources/images/characters/chad-right-arm.png";
import chadRightHand from "../../../resources/images/characters/chad-right-hand.png";
import chadTorso from "../../../resources/images/characters/chad-torso.png";
import { Character } from "./Character";

export const Chad: Character = {
  textures: {
    head: chadHead,
    leftArm: chadLeftArm,
    leftHand: chadLeftHand,
    rightArm: chadRightArm,
    rightHand: chadRightHand,
    torso: chadTorso,
  },

  sounds: {
    death: [chadDeath1],
    hurt: [
      chadHurt1,
      chadHurt2,
      chadHurt3,
      chadHurt4,
      chadHurt5,
      chadHurt6,
      chadHurt7,
    ],
    joinParty: [chadJoinParty1],
    lookHere: [chadLookHere1, chadLookHere2, chadLookHere3],
    misc: [chadMisc1, chadMisc2],
    nearDeath: [chadNearDeath1, chadNearDeath2],
    newLevel: [chadNewLevel1, chadNewLevel2, chadNewLevel3, chadNewLevel4],
    pickupItem: [chadPickup1, chadPickup2, chadPickup3],
    relief: [chadLevelComplete1, chadLevelComplete2, chadLevelComplete3],
    taunts: [
      chadTaunt1,
      chadTaunt2,
      chadTaunt3,
      chadTaunt4,
      chadTaunt5,
      chadTaunt6,
    ],
    worried: [chadWorried1, chadWorried2, chadWorried3],
  },
};
