import { UsableStats } from "./UsableStats";

// Every usable. First guesses; tune in playtest.

export const HealthPack: UsableStats = {
  name: "Health Pack",
  description: "Heals 40 health over 2 seconds. Three uses.",
  charges: 3,
  color: 0xeeeeee,
  accentColor: 0xcc2222,
  use: (human) => {
    if (human.hp >= human.maxHp) {
      return false;
    }
    human.healOverTime(40, 2);
    return true;
  },
};

export const StimPack: UsableStats = {
  name: "Stim Pack",
  description: "8 seconds of moving 30% faster and taking 40% less damage.",
  charges: 2,
  color: 0x2a3a4a,
  accentColor: 0x44ddff,
  use: (human) => {
    human.applyTimedStats({ moveSpeed: 1.3, damageTaken: 0.6 }, 8);
    return true;
  },
};

export const USABLES: ReadonlyArray<UsableStats> = [HealthPack, StimPack];
