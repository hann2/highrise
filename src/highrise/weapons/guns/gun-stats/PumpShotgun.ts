import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const PumpShotgun: GunStats = {
  ...defaultGunStats,

  name: "Remington Shotgun",
  fireRate: 2,
  bulletStats: TwelveGuageBuckshot,
  bulletSpread: degToRad(9),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.PUMP,
  reloadInsertTime: 0.4,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: "remingtonPickup",
    holding: "remington870Hold",
    shellCasing: "shotgunCasing",
  },
  size: [1.1, 1.1],
  recoilAmount: degToRad(8),
  recoilRecovery: 2,

  leftHandPosition: [0.7, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.5, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.1,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["shotgunShot3"],
    empty: ["dryFire1"],
    pickup: ["shotgunPump1"],
    reload: [],
    reloadInsert: ["shotgunLoadShell2"],
    reloadFinish: ["shotgunPump1"],
    pump: ["shotgunPump1"],
  },
};
