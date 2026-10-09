import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { SHOTGUN_ANIMATIONS } from "../gun-animations/shotgunReload";
import { DP12_FLASH } from "../muzzleFlashes";

/**
 * The Standard Manufacturing DP-12: a bullpup pump with two barrels side by
 * side, a magazine tube under each. One pump chambers both barrels and each
 * pull of the trigger fires one, so it pumps every other shot. 7 shells in each
 * tube and one in each chamber.
 */
export const DP12: GunStats = {
  ...defaultGunStats,

  name: "DP-12",
  flash: DP12_FLASH,
  // One barrel a click (it's semi-auto), as fast as a finger goes (a click
  // during the cooldown is dropped, so it's short), then the pump
  fireRate: 8,
  shotsPerPump: 2,
  bulletStats: TwelveGuageBuckshot,
  // 12 gauge 00 buckshot from an 18 7/8" barrel
  muzzleVelocity: 400,
  bulletSpread: degToRad(9),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.PUMP,
  reloadInsertTime: 0.4,
  ammoCapacity: 16,
  ammoClass: "shotgun",

  art: "dp12",
  textures: {
    ...defaultGunStats.textures,
    pickup: "dp12Pickup",
    shellCasing: "shotgunCasing",
  },
  size: [0.79, 0.79],
  recoilAmount: degToRad(8),
  recoilRecovery: 2,
  recoilSlide: 0.08,
  recoilTime: 0.05,

  points: {
    // The pistol grip, and the vertical grip under the pump
    grip: [-0.05, 0],
    foregrip: [0.214, 0],
    // The loading ports in the stock's belly, behind the grip
    magazine: [-0.168, 0],
    action: [0.214, 0],
  },
  // The pump (with the vertical grip on it) slides back, closing the gap in front of the receiver
  parts: { pump: { offset: [-0.095, 0], carries: ["foregrip", "action"] } },
  animations: SHOTGUN_ANIMATIONS,
  magazine: { texture: "shotgunShell", length: 0.075 },
  // Its grip where the other long guns' are (0.3 m in front of the holder): a bullpup, so its butt's at the shoulder
  holdPosition: [0.35, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
  muzzleLength: 0.375,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["shotgunShot1"],
    empty: ["dryFire1"],
    pickup: ["shotgunPump1"],
    reload: [],
    reloadInsert: ["shotgunLoadShell2"],
    reloadFinish: ["shotgunPump1"],
    pump: ["shotgunPump1"],
  },
};
