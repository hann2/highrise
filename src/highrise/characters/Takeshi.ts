import takeshiDeath1 from "../../../resources/audio/characters/takeshi/takeshi-death-1.flac";
import takeshiHurt1 from "../../../resources/audio/characters/takeshi/takeshi-hurt-1.flac";
import takeshiHurt2 from "../../../resources/audio/characters/takeshi/takeshi-hurt-2.flac";
import takeshiHurt3 from "../../../resources/audio/characters/takeshi/takeshi-hurt-3.flac";
import takeshiHurt4 from "../../../resources/audio/characters/takeshi/takeshi-hurt-4.flac";
import takeshiHurt6 from "../../../resources/audio/characters/takeshi/takeshi-hurt-6.flac";
import takeshiHurt7 from "../../../resources/audio/characters/takeshi/takeshi-hurt-7.flac";
import takeshiHurt8 from "../../../resources/audio/characters/takeshi/takeshi-hurt-8.flac";
import takeshiJoinParty1 from "../../../resources/audio/characters/takeshi/takeshi-join-party-1.flac";
import takeshiJoinParty2 from "../../../resources/audio/characters/takeshi/takeshi-join-party-2.flac";
import takeshiLevelComplete1 from "../../../resources/audio/characters/takeshi/takeshi-level-complete-1.flac";
import takeshiLevelComplete2 from "../../../resources/audio/characters/takeshi/takeshi-level-complete-2.flac";
import takeshiLookHere1 from "../../../resources/audio/characters/takeshi/takeshi-look-here-1.flac";
import takeshiMisc1 from "../../../resources/audio/characters/takeshi/takeshi-misc-1.flac";
import takeshiNearDeath1 from "../../../resources/audio/characters/takeshi/takeshi-near-death-1.flac";
import takeshiNewLevel1 from "../../../resources/audio/characters/takeshi/takeshi-new-level-1.flac";
import takeshiPickup1 from "../../../resources/audio/characters/takeshi/takeshi-pickup-1.flac";
import takeshiPickup2 from "../../../resources/audio/characters/takeshi/takeshi-pickup-2.flac";
import takeshiTaunt1 from "../../../resources/audio/characters/takeshi/takeshi-taunt-1.flac";
import takeshiTaunt2 from "../../../resources/audio/characters/takeshi/takeshi-taunt-2.flac";
import takeshiTaunt3 from "../../../resources/audio/characters/takeshi/takeshi-taunt-3.flac";
import takeshiTaunt4 from "../../../resources/audio/characters/takeshi/takeshi-taunt-4.flac";
import takeshiWorried1 from "../../../resources/audio/characters/takeshi/takeshi-worried-1.flac";
import takeshiWorried2 from "../../../resources/audio/characters/takeshi/takeshi-worried-2.flac";
import takeshiWorried3 from "../../../resources/audio/characters/takeshi/takeshi-worried-3.flac";
import takeshiHead from "../../../resources/images/characters/takeshi-head.png";
import takeshiLeftArm from "../../../resources/images/characters/takeshi-left-arm.png";
import takeshiLeftHand from "../../../resources/images/characters/takeshi-left-hand.png";
import takeshiRightArm from "../../../resources/images/characters/takeshi-right-arm.png";
import takeshiRightHand from "../../../resources/images/characters/takeshi-right-hand.png";
import takeshiTorso from "../../../resources/images/characters/takeshi-torso.png";
import { Character } from "./Character";

export const Takeshi: Character = {
  textures: {
    head: takeshiHead,
    leftArm: takeshiLeftArm,
    leftHand: takeshiLeftHand,
    rightArm: takeshiRightArm,
    rightHand: takeshiRightHand,
    torso: takeshiTorso,
  },

  sounds: {
    death: [takeshiDeath1],
    hurt: [
      takeshiHurt1,
      takeshiHurt2,
      takeshiHurt3,
      takeshiHurt4,
      takeshiHurt6,
      takeshiHurt7,
      takeshiHurt8,
    ],
    joinParty: [takeshiJoinParty1, takeshiJoinParty2],
    lookHere: [takeshiLookHere1],
    misc: [takeshiMisc1],
    nearDeath: [takeshiNearDeath1],
    newLevel: [takeshiNewLevel1],
    pickupItem: [takeshiPickup1, takeshiPickup2],
    relief: [takeshiLevelComplete1, takeshiLevelComplete2],
    taunts: [takeshiTaunt1, takeshiTaunt2, takeshiTaunt3, takeshiTaunt4],
    worried: [takeshiWorried1, takeshiWorried2, takeshiWorried3],
  },
};
