import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { SHOTGUN_ANIMATIONS } from "../gun-animations/shotgunReload";
import { PUMP_SHOTGUN_FLASH } from "../muzzleFlashes";

export const PumpShotgun: GunStats = {
  ...defaultGunStats,

  name: "Remington Shotgun",
  flash: PUMP_SHOTGUN_FLASH,
  fireRate: 2,
  bulletStats: TwelveGuageBuckshot,
  // 12 gauge 00 buckshot from an 18"+ barrel
  muzzleVelocity: 400,
  bulletSpread: degToRad(9),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.PUMP,
  reloadInsertTime: 0.4,
  ammoCapacity: 7,
  ammoClass: "shotgun",

  art: "remington870",
  textures: {
    ...defaultGunStats.textures,
    pickup: "remingtonPickup",
    shellCasing: "shotgunCasing",
  },
  size: [1.1, 1.1],
  recoilAmount: degToRad(8),
  recoilRecovery: 2,
  recoilSlide: 0.08,
  recoilTime: 0.05,

  points: {
    grip: [-0.2, 0],
    foregrip: [0.2, -0.03],
    magazine: [-0.1, 0],
    action: [0.2, -0.03],
  },
  // The pump slides back along the magazine tube, with the hand on it
  parts: { pump: { offset: [-0.12, 0], carries: ["foregrip", "action"] } },
  animations: SHOTGUN_ANIMATIONS,
  magazine: { texture: "shotgunShell", length: 0.075 },
  holdPosition: [0.5, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
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
