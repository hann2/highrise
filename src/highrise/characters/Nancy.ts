import nancyDeath3 from "../../../resources/audio/characters/nancy/nancy-death-3.flac";
import nancyHurt1 from "../../../resources/audio/characters/nancy/nancy-hurt-1.flac";
import nancyHurt2 from "../../../resources/audio/characters/nancy/nancy-hurt-2.flac";
import nancyHurt3 from "../../../resources/audio/characters/nancy/nancy-hurt-3.flac";
import nancyHurt4 from "../../../resources/audio/characters/nancy/nancy-hurt-4.flac";
import nancyHurt5 from "../../../resources/audio/characters/nancy/nancy-hurt-5.flac";
import nancyHurt6 from "../../../resources/audio/characters/nancy/nancy-hurt-6.flac";
import nancyJoinParty1 from "../../../resources/audio/characters/nancy/nancy-join-party-1.flac";
import nancyJoinParty2 from "../../../resources/audio/characters/nancy/nancy-join-party-2.flac";
import nancyJoinParty3 from "../../../resources/audio/characters/nancy/nancy-join-party-3.flac";
import nancyLookHere1 from "../../../resources/audio/characters/nancy/nancy-look-here-1.flac";
import nancyLookHere2 from "../../../resources/audio/characters/nancy/nancy-look-here-2.flac";
import nancyLookHere3 from "../../../resources/audio/characters/nancy/nancy-look-here-3.flac";
import nancyMisc1 from "../../../resources/audio/characters/nancy/nancy-misc-1.flac";
import nancyMisc2 from "../../../resources/audio/characters/nancy/nancy-misc-2.flac";
import nancyNearDeath1 from "../../../resources/audio/characters/nancy/nancy-near-death-1.flac";
import nancyNearDeath2 from "../../../resources/audio/characters/nancy/nancy-near-death-2.flac";
import nancyNewLevel3 from "../../../resources/audio/characters/nancy/nancy-new-level-3.flac";
import nancyPickup1 from "../../../resources/audio/characters/nancy/nancy-pickup-1.flac";
import nancyPickup2 from "../../../resources/audio/characters/nancy/nancy-pickup-2.flac";
import nancyPickup3 from "../../../resources/audio/characters/nancy/nancy-pickup-3.flac";
import nancyRelief1 from "../../../resources/audio/characters/nancy/nancy-relief-1.flac";
import nancyRelief2 from "../../../resources/audio/characters/nancy/nancy-relief-2.flac";
import nancyRelief3 from "../../../resources/audio/characters/nancy/nancy-relief-3.flac";
import nancyWorried1 from "../../../resources/audio/characters/nancy/nancy-worried-1.flac";
import nancyWorried2 from "../../../resources/audio/characters/nancy/nancy-worried-2.flac";
import nancyWorried3 from "../../../resources/audio/characters/nancy/nancy-worried-3.flac";
import nancyHead from "../../../resources/images/characters/nancy-head.png";
import nancyLeftArm from "../../../resources/images/characters/nancy-left-arm.png";
import nancyLeftHand from "../../../resources/images/characters/nancy-left-hand.png";
import nancyRightArm from "../../../resources/images/characters/nancy-right-arm.png";
import nancyRightHand from "../../../resources/images/characters/nancy-right-hand.png";
import nancyTorso from "../../../resources/images/characters/nancy-torso.png";
import { Character } from "./Character";

export const Nancy: Character = {
  // TODO: Nancy Textures
  textures: {
    head: nancyHead,
    leftArm: nancyLeftArm,
    leftHand: nancyLeftHand,
    rightArm: nancyRightArm,
    rightHand: nancyRightHand,
    torso: nancyTorso,
  },

  sounds: {
    death: [nancyDeath3],
    hurt: [
      nancyHurt1,
      nancyHurt2,
      nancyHurt3,
      nancyHurt4,
      nancyHurt5,
      nancyHurt6,
    ],
    joinParty: [nancyJoinParty1, nancyJoinParty2, nancyJoinParty3, nancyHurt4],
    lookHere: [nancyLookHere1, nancyLookHere2, nancyLookHere3],
    misc: [nancyMisc1, nancyMisc2],
    nearDeath: [nancyNearDeath1, nancyNearDeath2],
    newLevel: [nancyNewLevel3],
    pickupItem: [nancyPickup1, nancyPickup2, nancyPickup3],
    relief: [nancyRelief1, nancyRelief2, nancyRelief3],
    taunts: [], // TODO: Find nancy taunt
    worried: [nancyWorried1, nancyWorried2, nancyWorried3],
  },
};
