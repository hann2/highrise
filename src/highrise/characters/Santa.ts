import snd_santaDeath1 from "../../../resources/audio/characters/santa/santa-death-1.flac";
import snd_santaHoHoHo1 from "../../../resources/audio/characters/santa/santa-ho-ho-ho-1.flac";
import snd_santaHoHoHo2 from "../../../resources/audio/characters/santa/santa-ho-ho-ho-2.flac";
import snd_santaHoHoHo3 from "../../../resources/audio/characters/santa/santa-ho-ho-ho-3.flac";
import snd_santaHurt1 from "../../../resources/audio/characters/santa/santa-hurt-1.flac";
import snd_santaHurt2 from "../../../resources/audio/characters/santa/santa-hurt-2.flac";
import snd_santaHurt3 from "../../../resources/audio/characters/santa/santa-hurt-3.flac";
import snd_santaHurt4 from "../../../resources/audio/characters/santa/santa-hurt-4.flac";
import snd_santaHurt5 from "../../../resources/audio/characters/santa/santa-hurt-5.flac";
import snd_santaHurt6 from "../../../resources/audio/characters/santa/santa-hurt-6.flac";
import snd_santaHurt7 from "../../../resources/audio/characters/santa/santa-hurt-7.flac";
import snd_santaHurt8 from "../../../resources/audio/characters/santa/santa-hurt-8.flac";
import snd_santaJoin1 from "../../../resources/audio/characters/santa/santa-join-1.flac";
import snd_santaNewLevel1 from "../../../resources/audio/characters/santa/santa-new-level-1.flac";
import snd_santaNewLevel2 from "../../../resources/audio/characters/santa/santa-new-level-2.flac";
import snd_santaPickup2 from "../../../resources/audio/characters/santa/santa-pickup-2.flac";
import snd_santaPickupGun1 from "../../../resources/audio/characters/santa/santa-pickup-gun-1.flac";
import snd_santaTaunt1 from "../../../resources/audio/characters/santa/santa-taunt-1.flac";
import snd_santaTaunt2 from "../../../resources/audio/characters/santa/santa-taunt-2.flac";
import snd_santaTaunt3 from "../../../resources/audio/characters/santa/santa-taunt-3.flac";
import snd_santaTaunt4 from "../../../resources/audio/characters/santa/santa-taunt-4.flac";
import snd_santaTaunt5 from "../../../resources/audio/characters/santa/santa-taunt-5.flac";
import snd_santaTaunt6 from "../../../resources/audio/characters/santa/santa-taunt-6.flac";
import snd_santaTaunt7 from "../../../resources/audio/characters/santa/santa-taunt-7.flac";
import snd_santaWorried1 from "../../../resources/audio/characters/santa/santa-worried-1.flac";
import snd_santaWorried2 from "../../../resources/audio/characters/santa/santa-worried-2.flac";
import img_santaHead from "../../../resources/images/characters/santa-head.png";
import img_santaLeftArm from "../../../resources/images/characters/santa-left-arm.png";
import img_santaLeftHand from "../../../resources/images/characters/santa-left-hand.png";
import img_santaRightArm from "../../../resources/images/characters/santa-right-arm.png";
import img_santaRightHand from "../../../resources/images/characters/santa-right-hand.png";
import img_santaTorso from "../../../resources/images/characters/santa-torso.png";
import { Character } from "./Character";

export const Santa: Character = {
  textures: {
    head: img_santaHead,
    leftArm: img_santaLeftArm,
    leftHand: img_santaLeftHand,
    rightArm: img_santaRightArm,
    rightHand: img_santaRightHand,
    torso: img_santaTorso,
  },

  sounds: {
    death: [snd_santaDeath1],
    hurt: [
      snd_santaHurt1,
      snd_santaHurt2,
      snd_santaHurt3,
      snd_santaHurt4,
      snd_santaHurt5,
      snd_santaHurt6,
      snd_santaHurt7,
      snd_santaHurt8,
    ],
    joinParty: [snd_santaJoin1],
    lookHere: [snd_santaHoHoHo3],
    misc: [],
    nearDeath: [], // TODO: Santa near death
    newLevel: [snd_santaNewLevel1, snd_santaNewLevel2],
    pickupItem: [snd_santaPickup2, snd_santaHoHoHo1, snd_santaHoHoHo2],
    pickupGun: [snd_santaPickupGun1],
    pickupMelee: [snd_santaPickup2, snd_santaHoHoHo1, snd_santaHoHoHo2],
    pickupHealth: [snd_santaHoHoHo1, snd_santaHoHoHo2],
    relief: [],
    taunts: [
      snd_santaTaunt1,
      snd_santaTaunt2,
      snd_santaTaunt3,
      snd_santaTaunt4,
      snd_santaTaunt5,
      snd_santaTaunt6,
      snd_santaTaunt7,
    ],
    worried: [snd_santaWorried1, snd_santaWorried2],
  },
};
