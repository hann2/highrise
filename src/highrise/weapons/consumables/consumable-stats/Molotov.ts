import { ConsumableStats } from "../ConsumableStats";

export const Molotov: ConsumableStats = {
  name: "Molotov",
  description: "Breaks where it lands and sets the floor on fire.",
  maxCarry: 3,

  throwSpeed: 8,
  // Only if it somehow never hits anything
  fuseTime: 3,
  breaksOnImpact: true,

  shape: "bottle",
  size: [0.28, 0.09],
  color: 0x4a6a3a,
  accentColor: 0xd8c8a0,

  damage: 0,
  damageRadius: 0,
  knockback: 0,
  stunRadius: 0,
  stunDuration: 0,
  flash: { radius: 7, color: 0xff8030, intensity: 1.2, duration: 0.5 },
  fire: { radius: 1.8, fuel: 7 },
  sounds: {
    // Stand-ins until there are glass and fire sounds
    detonate: [
      { name: "wallHit2", speed: 1.6, gain: 0.7 },
      { name: "spitterSpit2", speed: 0.6, gain: 0.8 },
      { name: "swordSwoosh2", speed: 0.4, gain: 1 },
    ],
    bounce: ["glowStickDrop1", "glowStickDrop2"],
  },
};
