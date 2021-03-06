import { GunStats } from "../GunStats";
import { AK47 } from "./AK-47";
import { AR15 } from "./AR-15";
import { DesertEagle } from "./DesertEagle";
import { DoubleBarrelShotgun } from "./DoubleBarrelShotgun";
import { FiveSeven } from "./FiveSeven";
import { Glock } from "./Glock";
import { M1911 } from "./M1911";
import { Revolver } from "./Revolver";
import { P90 } from "./P90";
import { PumpShotgun } from "./PumpShotgun";
import { SPAS12 } from "./SPAS12";
import Gun from "../Gun";

// A list of all the guns
export const GUNS: Array<GunStats> = [
  AK47,
  AR15,
  DesertEagle,
  DoubleBarrelShotgun,
  FiveSeven,
  Glock,
  M1911,
  Revolver,
  P90,
  PumpShotgun,
  SPAS12,
];

export const PISTOLS = [M1911, Glock, FiveSeven, Revolver, DesertEagle];
export const SHOTGUNS = [DoubleBarrelShotgun, PumpShotgun, SPAS12];
export const RIFLES = [AR15, AK47, P90];

export const GUN_TIERS = [
  [M1911, Glock, Revolver, FiveSeven],
  [DesertEagle, AR15, DoubleBarrelShotgun],
  [PumpShotgun],
  [AK47, SPAS12, P90],
];

export function getGunTier(gun: Gun): number {
  for (let i = 0; i < GUN_TIERS.length; i++) {
    if (GUN_TIERS[i].includes(gun.stats)) {
      return i;
    }
  }
  return -1;
}
