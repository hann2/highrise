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
import cindyHead from "../../../resources/images/characters/cindy-head.png";
import cindyLeftArm from "../../../resources/images/characters/cindy-left-arm.png";
import cindyLeftHand from "../../../resources/images/characters/cindy-left-hand.png";
import cindyRightArm from "../../../resources/images/characters/cindy-right-arm.png";
import cindyRightHand from "../../../resources/images/characters/cindy-right-hand.png";
import cindyTorso from "../../../resources/images/characters/cindy-torso.png";
import { Character } from "./Character";

export const Cindy: Character = {
  textures: {
    head: cindyHead,
    leftArm: cindyLeftArm,
    leftHand: cindyLeftHand,
    rightArm: cindyRightArm,
    rightHand: cindyRightHand,
    torso: cindyTorso,
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
