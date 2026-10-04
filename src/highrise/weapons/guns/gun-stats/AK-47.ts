import { degToRad } from "../../../../core/util/MathUtil";
import { SevenSixTwo } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { rifleAnimations } from "../gun-animations/rifleReload";
import { AK47_FLASH } from "../muzzleFlashes";

export const AK47: GunStats = {
  ...defaultGunStats,

  name: "AK-47",
  flash: AK47_FLASH,
  fireRate: 10,
  bulletStats: SevenSixTwo,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 1.8,
  ammoCapacity: 30,
  ammoClass: "rifle",

  textures: {
    ...defaultGunStats.textures,
    pickup: "ak47Pickup",
    holding: "ak47Hold",
    shellCasing: "rifleCasing",
  },
  size: [1.4, 1.4],

  recoilAmount: degToRad(4),
  recoilRecovery: 3.1,
  recoilSlide: 0.04,
  recoilTime: 0.032,

  points: {
    grip: [-0.23, 0],
    foregrip: [0.1, -0.03],
    magazine: [-0.1, 0],
    action: [-0.06, 0.035],
  },
  animations: rifleAnimations(),
  magazine: { texture: "akMagazine", length: 0.24 },
  holdPosition: [0.55, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
  muzzleLength: 0.98,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["rifle2Shot1"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
