import clydeDeath1 from "../../../resources/audio/characters/clyde/clyde-death-1.flac";
import clydeHurt1 from "../../../resources/audio/characters/clyde/clyde-hurt-1.flac";
import clydeHurt2 from "../../../resources/audio/characters/clyde/clyde-hurt-2.flac";
import clydeJoinParty1 from "../../../resources/audio/characters/clyde/clyde-join-party-1.flac";
import clydeLookHere1 from "../../../resources/audio/characters/clyde/clyde-look-here-1.flac";
import clydeLookHere2 from "../../../resources/audio/characters/clyde/clyde-look-here-2.flac";
import clydeMisc1 from "../../../resources/audio/characters/clyde/clyde-misc-1.flac";
import clydeNearDeath from "../../../resources/audio/characters/clyde/clyde-near-death.flac";
import clydeNewLevel1 from "../../../resources/audio/characters/clyde/clyde-new-level-1.flac";
import clydeNewLevel2 from "../../../resources/audio/characters/clyde/clyde-new-level-2.flac";
import clydeNewLevel3 from "../../../resources/audio/characters/clyde/clyde-new-level-3.flac";
import clydeNewLevel4 from "../../../resources/audio/characters/clyde/clyde-new-level-4.flac";
import clydePickup1 from "../../../resources/audio/characters/clyde/clyde-pickup-1.flac";
import clydeRelief1 from "../../../resources/audio/characters/clyde/clyde-relief-1.flac";
import clydeRelief2 from "../../../resources/audio/characters/clyde/clyde-relief-2.flac";
import clydeRelief3 from "../../../resources/audio/characters/clyde/clyde-relief-3.flac";
import clydeTaunt1 from "../../../resources/audio/characters/clyde/clyde-taunt-1.flac";
import clydeTaunt2 from "../../../resources/audio/characters/clyde/clyde-taunt-2.flac";
import clydeWorried1 from "../../../resources/audio/characters/clyde/clyde-worried-1.flac";
import clydeWorried2 from "../../../resources/audio/characters/clyde/clyde-worried-2.flac";
import clydeWorried3 from "../../../resources/audio/characters/clyde/clyde-worried-3.flac";
import clydeWorried4 from "../../../resources/audio/characters/clyde/clyde-worried-4.flac";
import mikeHead from "../../../resources/images/characters/mike-head.png";
import mikeLeftArm from "../../../resources/images/characters/mike-left-arm.png";
import mikeLeftHand from "../../../resources/images/characters/mike-left-hand.png";
import mikeRightArm from "../../../resources/images/characters/mike-right-arm.png";
import mikeRightHand from "../../../resources/images/characters/mike-right-hand.png";
import mikeTorso from "../../../resources/images/characters/mike-torso.png";
import { Character } from "./Character";

export const Clyde: Character = {
  textures: {
    head: mikeHead,
    leftArm: mikeLeftArm,
    leftHand: mikeLeftHand,
    rightArm: mikeRightArm,
    rightHand: mikeRightHand,
    torso: mikeTorso,
  },

  sounds: {
    death: [clydeDeath1],
    hurt: [clydeHurt1, clydeHurt2],
    joinParty: [clydeJoinParty1],
    lookHere: [clydeLookHere1, clydeLookHere2],
    misc: [clydeMisc1],
    nearDeath: [clydeNearDeath],
    newLevel: [clydeNewLevel1, clydeNewLevel2, clydeNewLevel3, clydeNewLevel4],
    pickupItem: [clydePickup1],
    relief: [clydeRelief1, clydeRelief2, clydeRelief3],
    taunts: [clydeTaunt1, clydeTaunt2],
    worried: [clydeWorried1, clydeWorried2, clydeWorried3, clydeWorried4],
  },
};
