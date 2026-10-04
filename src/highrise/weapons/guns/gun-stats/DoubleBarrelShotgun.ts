import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { DOUBLE_BARREL_ANIMATIONS } from "../gun-animations/doubleBarrelReload";
import { SAWN_OFF_FLASH } from "../muzzleFlashes";

export const DoubleBarrelShotgun: GunStats = {
  ...defaultGunStats,

  name: "Sawn Off Shotgun",
  flash: SAWN_OFF_FLASH,
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

  points: {
    grip: [-0.1, 0],
    foregrip: [0.12, -0.03],
    magazine: [0, 0],
    action: [0.12, -0.03],
  },
  animations: DOUBLE_BARREL_ANIMATIONS,
  magazine: { texture: "shotgunShellPair", length: 0.075 },
  holdPosition: [0.4, 0],
  stanceAngle: degToRad(35),
  sideOffset: 0.2,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["shotgunShot1"],
    empty: ["dryFire1"],
    pickup: ["shotgunPump1"],
    reload: ["shotgunLoadShell2"],
  },
};
