import snd_cindyDeath1 from "../../../resources/audio/characters/cindy/cindy-death-1.flac";
import snd_cindyHurt1 from "../../../resources/audio/characters/cindy/cindy-hurt-1.flac";
import snd_cindyHurt2 from "../../../resources/audio/characters/cindy/cindy-hurt-2.flac";
import snd_cindyHurt3 from "../../../resources/audio/characters/cindy/cindy-hurt-3.flac";
import snd_cindyJoinParty1 from "../../../resources/audio/characters/cindy/cindy-join-party-1.flac";
import snd_cindyLookHere1 from "../../../resources/audio/characters/cindy/cindy-look-here-1.flac";
import snd_cindyLookHere2 from "../../../resources/audio/characters/cindy/cindy-look-here-2.flac";
import snd_cindyMisc1 from "../../../resources/audio/characters/cindy/cindy-misc-1.flac";
import snd_cindyNearDeath1 from "../../../resources/audio/characters/cindy/cindy-near-death-1.flac";
import snd_cindyNewLevel1 from "../../../resources/audio/characters/cindy/cindy-new-level-1.flac";
import snd_cindyPickup1 from "../../../resources/audio/characters/cindy/cindy-pickup-1.flac";
import snd_cindyRelief1 from "../../../resources/audio/characters/cindy/cindy-relief-1.flac";
import snd_cindyTaunt1 from "../../../resources/audio/characters/cindy/cindy-taunt-1.flac";
import snd_cindyTaunt2 from "../../../resources/audio/characters/cindy/cindy-taunt-2.flac";
import snd_cindyWorried1 from "../../../resources/audio/characters/cindy/cindy-worried-1.flac";
import img_cindyHead from "../../../resources/images/characters/cindy-head.png";
import img_cindyLeftArm from "../../../resources/images/characters/cindy-left-arm.png";
import img_cindyLeftHand from "../../../resources/images/characters/cindy-left-hand.png";
import img_cindyRightArm from "../../../resources/images/characters/cindy-right-arm.png";
import img_cindyRightHand from "../../../resources/images/characters/cindy-right-hand.png";
import img_cindyTorso from "../../../resources/images/characters/cindy-torso.png";
import { Character } from "./Character";

export const Cindy: Character = {
  textures: {
    head: img_cindyHead,
    leftArm: img_cindyLeftArm,
    leftHand: img_cindyLeftHand,
    rightArm: img_cindyRightArm,
    rightHand: img_cindyRightHand,
    torso: img_cindyTorso,
  },

  sounds: {
    death: [snd_cindyDeath1],
    hurt: [snd_cindyHurt1, snd_cindyHurt2, snd_cindyHurt3],
    joinParty: [snd_cindyJoinParty1],
    lookHere: [snd_cindyLookHere1, snd_cindyLookHere2],
    misc: [snd_cindyMisc1],
    nearDeath: [snd_cindyNearDeath1],
    newLevel: [snd_cindyNewLevel1],
    pickupItem: [snd_cindyPickup1],
    pickupGun: [snd_cindyPickup1],
    pickupMelee: [snd_cindyPickup1],
    pickupHealth: [snd_cindyPickup1],
    relief: [snd_cindyRelief1],
    taunts: [snd_cindyTaunt1, snd_cindyTaunt2],
    worried: [snd_cindyWorried1],
  },
};
