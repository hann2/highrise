import AK47 from "./AK-47";
import AR15 from "./AR-15";
import DesertEagle from "./DesertEagle";
import DoubleBarrelShotgun from "./DoubleBarrelShotgun";
import FiveSeven from "./FiveSeven";
import Glock from "./Glock";
import Gun from "./Gun";
import M1911 from "./M1911";
import Magnum from "./Magnum";
import PumpShotgun from "./PumpShotgun";

// A list of all the guns
export const GUNS: Array<new () => Gun> = [
  AK47,
  AR15,
  DesertEagle,
  DoubleBarrelShotgun,
  FiveSeven,
  Glock,
  M1911,
  Magnum,
  PumpShotgun,
];
