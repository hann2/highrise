/**
 * Reserve ammo is kept per class of ammo rather than per gun, so swapping one
 * rifle for another doesn't cost you your reserve. Every class runs out, and
 * more is found in boxes or bought from ammo machines: ammo is a running cost.
 * First guesses; tune in playtest (a floor's quarters should cover a floor's
 * pistol ammo).
 */
export type AmmoClass = "pistol" | "rifle" | "shotgun";

export const AMMO_CLASSES: ReadonlyArray<AmmoClass> = [
  "pistol",
  "rifle",
  "shotgun",
];

/** Reserve rounds every human starts the run with */
export const STARTING_RESERVE: Record<AmmoClass, number> = {
  pistol: 90,
  rifle: 0,
  shotgun: 0,
};

/** Extra reserve a gun comes with the first time it's picked up */
export const NEW_GUN_RESERVE_BONUS: Record<AmmoClass, number> = {
  pistol: 30,
  rifle: 30,
  shotgun: 8,
};

/** Rounds in an ammo box (`AmmoPickup`), and what an ammo machine sells */
export const AMMO_BOX: Record<AmmoClass, number> = {
  pistol: 30,
  rifle: 30,
  shotgun: 8,
};

/** What a box costs at an ammo machine, in quarters */
export const AMMO_PRICE: Record<AmmoClass, number> = {
  pistol: 2,
  rifle: 4,
  shotgun: 5,
};

/** Most reserve rounds one human can carry */
export const MAX_RESERVE: Record<AmmoClass, number> = {
  pistol: 300,
  rifle: 240,
  shotgun: 48,
};

/** Chance that an enemy drops an ammo box when it dies */
export const AMMO_DROP_CHANCE = 0.03;
/** Chance per kill with the Scavenger item, on top of `AMMO_DROP_CHANCE` */
export const SCAVENGER_DROP_CHANCE = 0.15;

export function ammoClassName(ammoClass: AmmoClass): string {
  switch (ammoClass) {
    case "pistol":
      return "Pistol";
    case "rifle":
      return "Rifle";
    case "shotgun":
      return "Shotgun";
  }
}
