import { GunStats } from "../GunStats";
import { AK47 } from "./AK-47";
import { AR15 } from "./AR-15";
import { DesertEagle } from "./DesertEagle";
import { DoubleBarrelShotgun } from "./DoubleBarrelShotgun";
import { FiveSeven } from "./FiveSeven";
import { Glock } from "./Glock";
import { M1911 } from "./M1911";
import { Magnum } from "./Magnum";
import { P90 } from "./P90";
import { PumpShotgun } from "./PumpShotgun";
import { SPAS12 } from "./SPAS12";

// A list of all the guns
export const GUNS: Array<GunStats> = [
  AK47,
  AR15,
  DesertEagle,
  DoubleBarrelShotgun,
  FiveSeven,
  Glock,
  M1911,
  Magnum,
  P90,
  PumpShotgun,
  SPAS12,
];

export const TIERS = [
  [M1911, Glock, Magnum, FiveSeven],
  [DesertEagle, AR15, DoubleBarrelShotgun],
  [PumpShotgun],
  [AK47, SPAS12, P90],
];
