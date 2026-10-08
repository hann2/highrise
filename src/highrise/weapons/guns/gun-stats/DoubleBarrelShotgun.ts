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
  // 12 gauge 00 buckshot, sawn off to about 12"
  muzzleVelocity: 340,
  bulletSpread: degToRad(20),
  reloadingStyle: ReloadingStyle.MAGAZINE,
  fireMode: FireMode.SEMI_AUTO,
  ejectionType: EjectionType.RELOAD,
  reloadInsertTime: 1.2,
  ammoCapacity: 2,
  ammoClass: "shotgun",

  art: "doubleBarrelShotgun",
  textures: {
    ...defaultGunStats.textures,
    pickup: "doubleBarrelShotgunPickup",
    shellCasing: "shotgunCasing",
  },
  size: [0.7, 0.7],

  recoilAmount: degToRad(10),
  recoilRecovery: 3,
  recoilSlide: 0.1,
  recoilTime: 0.05,

  points: {
    grip: [-0.084, 0],
    foregrip: [0.197, -0.0225],
    magazine: [0.036, 0],
    action: [0.197, -0.0225],
  },
  // Broken open: the barrels tip down on the hinge at the front of the
  // receiver (so they look shorter from above), once the top lever's pushed
  // aside
  parts: {
    barrels: { stretch: 0.8, pivot: [0.175, 0] },
    "top-lever": { angle: -0.6, pivot: [0.005, 0] },
  },
  animations: DOUBLE_BARREL_ANIMATIONS,
  magazine: { texture: "shotgunShellPair", length: 0.075 },
  holdPosition: [0.384, 0],
  muzzleLength: 0.341,
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
