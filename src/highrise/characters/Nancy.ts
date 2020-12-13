import snd_nancyDeath3 from "../../../resources/audio/characters/nancy/nancy-death-3.flac";
import snd_nancyHurt1 from "../../../resources/audio/characters/nancy/nancy-hurt-1.flac";
import snd_nancyHurt2 from "../../../resources/audio/characters/nancy/nancy-hurt-2.flac";
import snd_nancyHurt3 from "../../../resources/audio/characters/nancy/nancy-hurt-3.flac";
import snd_nancyHurt4 from "../../../resources/audio/characters/nancy/nancy-hurt-4.flac";
import snd_nancyHurt5 from "../../../resources/audio/characters/nancy/nancy-hurt-5.flac";
import snd_nancyHurt6 from "../../../resources/audio/characters/nancy/nancy-hurt-6.flac";
import snd_nancyJoinParty1 from "../../../resources/audio/characters/nancy/nancy-join-party-1.flac";
import snd_nancyJoinParty2 from "../../../resources/audio/characters/nancy/nancy-join-party-2.flac";
import snd_nancyJoinParty3 from "../../../resources/audio/characters/nancy/nancy-join-party-3.flac";
import snd_nancyLookHere1 from "../../../resources/audio/characters/nancy/nancy-look-here-1.flac";
import snd_nancyLookHere2 from "../../../resources/audio/characters/nancy/nancy-look-here-2.flac";
import snd_nancyLookHere3 from "../../../resources/audio/characters/nancy/nancy-look-here-3.flac";
import snd_nancyMisc1 from "../../../resources/audio/characters/nancy/nancy-misc-1.flac";
import snd_nancyMisc2 from "../../../resources/audio/characters/nancy/nancy-misc-2.flac";
import snd_nancyNearDeath1 from "../../../resources/audio/characters/nancy/nancy-near-death-1.flac";
import snd_nancyNearDeath2 from "../../../resources/audio/characters/nancy/nancy-near-death-2.flac";
import snd_nancyNewLevel3 from "../../../resources/audio/characters/nancy/nancy-new-level-3.flac";
import snd_nancyPickup1 from "../../../resources/audio/characters/nancy/nancy-pickup-1.flac";
import snd_nancyPickup2 from "../../../resources/audio/characters/nancy/nancy-pickup-2.flac";
import snd_nancyPickup3 from "../../../resources/audio/characters/nancy/nancy-pickup-3.flac";
import snd_nancyRelief1 from "../../../resources/audio/characters/nancy/nancy-relief-1.flac";
import snd_nancyRelief2 from "../../../resources/audio/characters/nancy/nancy-relief-2.flac";
import snd_nancyRelief3 from "../../../resources/audio/characters/nancy/nancy-relief-3.flac";
import snd_nancyTaunt1 from "../../../resources/audio/characters/nancy/nancy-taunt-1.flac";
import snd_nancyTaunt2 from "../../../resources/audio/characters/nancy/nancy-taunt-2.flac";
import snd_nancyWorried1 from "../../../resources/audio/characters/nancy/nancy-worried-1.flac";
import snd_nancyWorried2 from "../../../resources/audio/characters/nancy/nancy-worried-2.flac";
import snd_nancyWorried3 from "../../../resources/audio/characters/nancy/nancy-worried-3.flac";
import img_nancyHead from "../../../resources/images/characters/nancy-head.png";
import img_nancyLeftArm from "../../../resources/images/characters/nancy-left-arm.png";
import img_nancyLeftHand from "../../../resources/images/characters/nancy-left-hand.png";
import img_nancyRightArm from "../../../resources/images/characters/nancy-right-arm.png";
import img_nancyRightHand from "../../../resources/images/characters/nancy-right-hand.png";
import img_nancyTorso from "../../../resources/images/characters/nancy-torso.png";
import { Character } from "./Character";

export const Nancy: Character = {
  textures: {
    head: img_nancyHead,
    leftArm: img_nancyLeftArm,
    leftHand: img_nancyLeftHand,
    rightArm: img_nancyRightArm,
    rightHand: img_nancyRightHand,
    torso: img_nancyTorso,
  },

  sounds: {
    death: [snd_nancyDeath3],
    hurt: [
      snd_nancyHurt1,
      snd_nancyHurt2,
      snd_nancyHurt3,
      snd_nancyHurt4,
      snd_nancyHurt5,
      snd_nancyHurt6,
    ],
    joinParty: [
      snd_nancyJoinParty1,
      snd_nancyJoinParty2,
      snd_nancyJoinParty3,
      snd_nancyHurt4,
    ],
    lookHere: [snd_nancyLookHere1, snd_nancyLookHere2, snd_nancyLookHere3],
    misc: [snd_nancyMisc1, snd_nancyMisc2],
    nearDeath: [snd_nancyNearDeath1, snd_nancyNearDeath2],
    newLevel: [snd_nancyNewLevel3],
    pickupItem: [snd_nancyPickup1, snd_nancyPickup2, snd_nancyPickup3],
    pickupGun: [snd_nancyPickup1, snd_nancyPickup2, snd_nancyPickup3],
    pickupMelee: [snd_nancyPickup1, snd_nancyPickup2, snd_nancyPickup3],
    pickupHealth: [snd_nancyPickup1, snd_nancyPickup2, snd_nancyPickup3],
    relief: [snd_nancyRelief1, snd_nancyRelief2, snd_nancyRelief3],
    taunts: [snd_nancyTaunt1, snd_nancyTaunt2],
    worried: [snd_nancyWorried1, snd_nancyWorried2, snd_nancyWorried3],
  },
};
