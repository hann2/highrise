import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { SHOTGUN_ANIMATIONS } from "../gun-animations/shotgunReload";
import { SPAS12_FLASH } from "../muzzleFlashes";

export const SPAS12: GunStats = {
  ...defaultGunStats,

  name: "SPAS12",
  flash: SPAS12_FLASH,
  fireRate: 8,
  bulletStats: TwelveGuageBuckshot,
  // 12 gauge 00 buckshot from a 21.5" barrel
  muzzleVelocity: 400,
  bulletSpread: degToRad(7),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.SEMI_AUTO,
  reloadInsertTime: 0.35,
  ammoCapacity: 8,
  ammoClass: "shotgun",

  art: "spas12",
  textures: {
    ...defaultGunStats.textures,
    pickup: "spas12Pickup",
    shellCasing: "shotgunCasing",
  },
  size: [0.82, 0.82],
  recoilAmount: degToRad(7),
  recoilRecovery: 2.2,
  recoilSlide: 0.075,
  recoilTime: 0.045,

  points: {
    grip: [-0.357, 0],
    foregrip: [0.041, -0.0205],
    magazine: [-0.196, 0],
    action: [0.041, -0.0205],
  },
  // The pump slides back along the magazine tube, with the hand on it
  parts: { pump: { offset: [-0.075, 0], carries: ["foregrip", "action"] } },
  animations: SHOTGUN_ANIMATIONS,
  magazine: { texture: "shotgunShell", length: 0.075 },
  holdPosition: [0.657, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
  muzzleLength: 0.399,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["shotgunShot2"],
    empty: ["dryFire1"],
    pickup: ["shotgunPump1"],
    reload: [],
    reloadInsert: ["shotgunLoadShell2"],
    reloadFinish: ["shotgunPump1"],
    pump: ["shotgunPump1"],
  },
};
