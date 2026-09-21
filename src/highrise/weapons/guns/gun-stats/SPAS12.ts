import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const SPAS12: GunStats = {
  ...defaultGunStats,

  name: "SPAS12",
  fireRate: 8,
  bulletStats: TwelveGuageBuckshot,
  bulletSpread: degToRad(7),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.SEMI_AUTO,
  reloadInsertTime: 0.35,
  ammoCapacity: 8,

  textures: {
    ...defaultGunStats.textures,
    pickup: "spas12Pickup",
    holding: "spas12Hold",
    shellCasing: "shotgunCasing",
  },
  size: [1.1, 1.1],
  recoilAmount: degToRad(7),
  recoilRecovery: 2.2,

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.6, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.2,

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
