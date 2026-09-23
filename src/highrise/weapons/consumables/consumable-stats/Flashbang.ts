import { ConsumableStats } from "../ConsumableStats";

export const Flashbang: ConsumableStats = {
  name: "Flashbang",
  description: "Stuns every enemy that can see it for 4 seconds.",
  maxCarry: 3,

  throwSpeed: 7,
  fuseTime: 1.5,

  size: [0.18, 0.09],
  color: 0x707880,
  accentColor: 0xd0d0d0,

  damage: 0,
  damageRadius: 0,
  knockback: 0,
  stunRadius: 5,
  stunDuration: 4,
  flash: { radius: 16, color: 0xffffff, intensity: 3, duration: 0.8 },
  blastRing: { radius: 5, color: 0xffffff },
  sounds: {
    detonate: [
      { name: "pistolShot2", speed: 0.6, gain: 1 },
      { name: "pop1", speed: 0.5, gain: 1 },
    ],
    bounce: ["glowStickDrop1", "glowStickDrop2"],
  },
};
