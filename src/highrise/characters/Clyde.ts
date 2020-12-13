import snd_clydeDeath1 from "../../../resources/audio/characters/clyde/clyde-death-1.flac";
import snd_clydeHurt1 from "../../../resources/audio/characters/clyde/clyde-hurt-1.flac";
import snd_clydeHurt2 from "../../../resources/audio/characters/clyde/clyde-hurt-2.flac";
import snd_clydeJoinParty1 from "../../../resources/audio/characters/clyde/clyde-join-party-1.flac";
import snd_clydeLookHere1 from "../../../resources/audio/characters/clyde/clyde-look-here-1.flac";
import snd_clydeLookHere2 from "../../../resources/audio/characters/clyde/clyde-look-here-2.flac";
import snd_clydeMisc1 from "../../../resources/audio/characters/clyde/clyde-misc-1.flac";
import snd_clydeNearDeath from "../../../resources/audio/characters/clyde/clyde-near-death.flac";
import snd_clydeNewLevel1 from "../../../resources/audio/characters/clyde/clyde-new-level-1.flac";
import snd_clydeNewLevel2 from "../../../resources/audio/characters/clyde/clyde-new-level-2.flac";
import snd_clydeNewLevel3 from "../../../resources/audio/characters/clyde/clyde-new-level-3.flac";
import snd_clydeNewLevel4 from "../../../resources/audio/characters/clyde/clyde-new-level-4.flac";
import snd_clydePickup1 from "../../../resources/audio/characters/clyde/clyde-pickup-1.flac";
import snd_clydeRelief1 from "../../../resources/audio/characters/clyde/clyde-relief-1.flac";
import snd_clydeRelief2 from "../../../resources/audio/characters/clyde/clyde-relief-2.flac";
import snd_clydeRelief3 from "../../../resources/audio/characters/clyde/clyde-relief-3.flac";
import snd_clydeTaunt1 from "../../../resources/audio/characters/clyde/clyde-taunt-1.flac";
import snd_clydeTaunt2 from "../../../resources/audio/characters/clyde/clyde-taunt-2.flac";
import snd_clydeWorried1 from "../../../resources/audio/characters/clyde/clyde-worried-1.flac";
import snd_clydeWorried2 from "../../../resources/audio/characters/clyde/clyde-worried-2.flac";
import snd_clydeWorried3 from "../../../resources/audio/characters/clyde/clyde-worried-3.flac";
import snd_clydeWorried4 from "../../../resources/audio/characters/clyde/clyde-worried-4.flac";
import img_mikeHead from "../../../resources/images/characters/mike-head.png";
import img_mikeLeftArm from "../../../resources/images/characters/mike-left-arm.png";
import img_mikeLeftHand from "../../../resources/images/characters/mike-left-hand.png";
import img_mikeRightArm from "../../../resources/images/characters/mike-right-arm.png";
import img_mikeRightHand from "../../../resources/images/characters/mike-right-hand.png";
import img_mikeTorso from "../../../resources/images/characters/mike-torso.png";
import { Character } from "./Character";

export const Clyde: Character = {
  textures: {
    head: img_mikeHead,
    leftArm: img_mikeLeftArm,
    leftHand: img_mikeLeftHand,
    rightArm: img_mikeRightArm,
    rightHand: img_mikeRightHand,
    torso: img_mikeTorso,
  },

  sounds: {
    death: [snd_clydeDeath1],
    hurt: [snd_clydeHurt1, snd_clydeHurt2],
    joinParty: [snd_clydeJoinParty1],
    lookHere: [snd_clydeLookHere1, snd_clydeLookHere2],
    misc: [snd_clydeMisc1],
    nearDeath: [snd_clydeNearDeath],
    newLevel: [
      snd_clydeNewLevel1,
      snd_clydeNewLevel2,
      snd_clydeNewLevel3,
      snd_clydeNewLevel4,
    ],
    pickupItem: [snd_clydePickup1],
    pickupGun: [snd_clydePickup1],
    pickupMelee: [snd_clydePickup1],
    pickupHealth: [snd_clydePickup1],
    relief: [snd_clydeRelief1, snd_clydeRelief2, snd_clydeRelief3],
    taunts: [snd_clydeTaunt1, snd_clydeTaunt2],
    worried: [
      snd_clydeWorried1,
      snd_clydeWorried2,
      snd_clydeWorried3,
      snd_clydeWorried4,
    ],
  },
};
