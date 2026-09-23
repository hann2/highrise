import { ConsumableStats } from "../ConsumableStats";

export const FragGrenade: ConsumableStats = {
  name: "Frag Grenade",
  description: "Explodes after 2 seconds, hurting everything nearby.",
  maxCarry: 3,

  throwSpeed: 7,
  fuseTime: 2,

  size: [0.16, 0.12],
  color: 0x3d4a2a,
  accentColor: 0x9a9a8a,

  damage: 200,
  damageRadius: 2.5,
  knockback: 250,
  stunRadius: 2.5,
  stunDuration: 0.6,
  flash: { radius: 9, color: 0xffb060, intensity: 1.5, duration: 0.35 },
  blastRing: { radius: 2.5, color: 0xffa040 },
  sounds: {
    detonate: [
      { name: "shotgunShot1", speed: 0.45, gain: 1 },
      { name: "deagleShot2", speed: 0.35, gain: 0.8 },
    ],
    bounce: ["glowStickDrop1", "glowStickDrop2"],
  },
};
