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
  bulletSpread: degToRad(7),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.SEMI_AUTO,
  reloadInsertTime: 0.35,
  ammoCapacity: 8,
  ammoClass: "shotgun",

  textures: {
    ...defaultGunStats.textures,
    pickup: "spas12Pickup",
    holding: "spas12Hold",
    shellCasing: "shotgunCasing",
  },
  size: [1.1, 1.1],
  recoilAmount: degToRad(7),
  recoilRecovery: 2.2,
  recoilSlide: 0.075,
  recoilTime: 0.045,

  points: {
    grip: [-0.3, 0],
    foregrip: [0.05, -0.03],
    magazine: [-0.18, 0],
    action: [0.05, -0.03],
  },
  animations: SHOTGUN_ANIMATIONS,
  magazine: { texture: "shotgunShell", length: 0.075 },
  holdPosition: [0.6, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
  muzzleLength: 1.1,

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
