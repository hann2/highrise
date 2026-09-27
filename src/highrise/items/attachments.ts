import type Human from "../human/Human";
import { AMMO_CLASSES, AmmoClass } from "../weapons/guns/ammo";
import type { GunStats } from "../weapons/guns/GunStats";
import type { Item, Rarity } from "./Item";

/** Where on a gun an attachment goes. A gun uses one attachment per slot. */
export type AttachmentSlot = "magazine" | "ammo" | "rail";

/**
 * A gun attachment. Owned by the human (`Human.attachments`), not the gun: it
 * goes on whatever gun in hand it fits, and moves to the next one of that
 * family. For each slot a gun uses the most recently taken attachment that
 * fits it (`Human.attachmentsFor`), so a new one for a family and slot
 * replaces the old one for that family only.
 */
export interface Attachment extends Item {
  readonly category: "attachment";
  readonly slot: AttachmentSlot;
  readonly fits: readonly AmmoClass[];
  /** Changes to the gun's stats (see `Gun.effectiveStats`) */
  modify?(stats: GunStats): Partial<GunStats>;
  /** Bullets set what they hit on fire */
  readonly incendiary?: boolean;
  /** How many enemies a bullet goes through before it stops */
  readonly pierce?: number;
  /** Every this many enemy hits, the bullet goes off like a small grenade */
  readonly explodeEvery?: number;
  /** Extra push damage while a gun it's on is in hand (a bayonet) */
  readonly pushDamage?: number;
}

export function isAttachment(item: Item): item is Attachment {
  return item.category === "attachment";
}

/** An attachment item: taking it adds it to the human's attachments */
function attachment(
  definition: Omit<Attachment, "category" | "apply"> & { rarity: Rarity },
): Attachment {
  const made: Attachment = {
    ...definition,
    category: "attachment",
    maxStacks: 1,
    apply: (human: Human) => human.addAttachment(made),
  };
  return made;
}

/** The gun's bullets, with their damage multiplied */
function moreDamage(stats: GunStats, multiplier: number): Partial<GunStats> {
  return {
    bulletStats: {
      ...stats.bulletStats,
      damage: stats.bulletStats.damage * multiplier,
    },
  };
}

// --- Magazine ---

const extendedMagazine = (name: string, family: AmmoClass) =>
  attachment({
    name,
    description: "Holds 50% more rounds.",
    rarity: "common",
    slot: "magazine",
    fits: [family],
    modify: (stats) => ({
      ammoCapacity: Math.round(stats.ammoCapacity * 1.5),
    }),
  });
export const ExtendedPistolMag = extendedMagazine(
  "Extended Pistol Mag",
  "pistol",
);
export const RifleDrum = extendedMagazine("Rifle Drum", "rifle");
export const ShellTube = extendedMagazine("Shell Tube", "shotgun");

// --- Ammo ---

export const HollowPoints = attachment({
  name: "Hollow Points",
  description: "Pistol rounds do 20% more damage.",
  rarity: "uncommon",
  slot: "ammo",
  fits: ["pistol"],
  modify: (stats) => moreDamage(stats, 1.2),
});

export const SoftPoints = attachment({
  name: "Soft Points",
  description: "Rifle rounds do 20% more damage.",
  rarity: "uncommon",
  slot: "ammo",
  fits: ["rifle"],
  modify: (stats) => moreDamage(stats, 1.2),
});

export const MagnumShells = attachment({
  name: "Magnum Shells",
  description: "Shotgun pellets do 20% more damage.",
  rarity: "uncommon",
  slot: "ammo",
  fits: ["shotgun"],
  modify: (stats) => moreDamage(stats, 1.2),
});

export const IncendiaryRounds = attachment({
  name: "Incendiary Rounds",
  description: "Bullets set what they hit on fire.",
  rarity: "rare",
  slot: "ammo",
  fits: ["pistol", "rifle"],
  incendiary: true,
});

export const DragonsBreath = attachment({
  name: "Dragon's Breath",
  description: "Pellets set what they hit on fire.",
  rarity: "rare",
  slot: "ammo",
  fits: ["shotgun"],
  incendiary: true,
});

export const ArmorPiercing = attachment({
  name: "Armor Piercing",
  description: "Bullets go through the first enemy they hit.",
  rarity: "uncommon",
  slot: "ammo",
  fits: ["pistol", "rifle"],
  pierce: 1,
});

export const ExplodingRounds = attachment({
  name: "Exploding Rounds",
  description: "Every fourth hit goes off like a small grenade.",
  rarity: "rare",
  slot: "ammo",
  fits: ["rifle"],
  explodeEvery: 4,
});

// --- Rail ---

export const LaserSight = attachment({
  name: "Laser Sight",
  description: "A laser sight, and 30% less spread.",
  rarity: "common",
  slot: "rail",
  fits: AMMO_CLASSES,
  modify: (stats) => ({
    laserSightColor: stats.laserSightColor ?? 0xff2020,
    bulletSpread: stats.bulletSpread * 0.7,
  }),
});

export const Bayonet = attachment({
  name: "Bayonet",
  description: "Pushes do 25 more damage with this gun in hand.",
  rarity: "uncommon",
  slot: "rail",
  fits: ["rifle", "shotgun"],
  pushDamage: 25,
});

export const Choke = attachment({
  name: "Choke",
  description: "Half the spread.",
  rarity: "uncommon",
  slot: "rail",
  fits: ["shotgun"],
  modify: (stats) => ({ bulletSpread: stats.bulletSpread * 0.5 }),
});

export const Compensator = attachment({
  name: "Compensator",
  description: "Half the recoil, and fires 10% faster.",
  rarity: "uncommon",
  slot: "rail",
  fits: ["pistol"],
  modify: (stats) => ({
    recoilAmount: stats.recoilAmount * 0.5,
    fireRate: stats.fireRate * 1.1,
  }),
});

export const ATTACHMENTS: ReadonlyArray<Attachment> = [
  ExtendedPistolMag,
  RifleDrum,
  ShellTube,
  HollowPoints,
  SoftPoints,
  MagnumShells,
  IncendiaryRounds,
  DragonsBreath,
  ArmorPiercing,
  ExplodingRounds,
  LaserSight,
  Bayonet,
  Choke,
  Compensator,
];
