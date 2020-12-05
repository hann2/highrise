import Axe from "./Axe";
import Katana from "./Katana";
import MeleeWeapon from "./MeleeWeapon";

// List of all melee weapons
export const MELEE_WEAPONS: Array<new () => MeleeWeapon> = [Axe, Katana];
