import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const DoubleBarrelShotgun: GunStats = {
  ...defaultGunStats,

  name: "Sawn Off Shotgun",
  fireRate: 10,
  bulletStats: TwelveGuageBuckshot,
  bulletSpread: degToRad(20),
  reloadingStyle: ReloadingStyle.MAGAZINE,
  fireMode: FireMode.SEMI_AUTO,
  ejectionType: EjectionType.RELOAD,
  reloadInsertTime: 1.2,
  ammoCapacity: 2,
  ammoClass: "shotgun",

  textures: {
    ...defaultGunStats.textures,
    pickup: "doubleBarrelShotgunPickup",
    holding: "doubleBarrelShotgunHold",
    shellCasing: "shotgunCasing",
  },
  size: [1.1, 1.1],

  recoilAmount: degToRad(10),
  recoilRecovery: 3,

  leftHandPosition: [0.52, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.4, 0],
  stanceAngle: degToRad(35),
  stanceOffset: [0, -0.2],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["shotgunShot1"],
    empty: ["dryFire1"],
    pickup: ["shotgunPump1"],
    reload: ["shotgunLoadShell2"],
  },
};
