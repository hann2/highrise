/**
 * Reserve ammo is kept per class of ammo rather than per gun, so swapping one
 * rifle for another doesn't cost you your reserve. Pistol ammo is unlimited;
 * the others run out.
 */
export type AmmoClass = "pistol" | "rifle" | "shotgun";

/** The classes whose reserves can run out */
export type LimitedAmmoClass = Exclude<AmmoClass, "pistol">;

export const LIMITED_AMMO_CLASSES: ReadonlyArray<LimitedAmmoClass> = [
  "rifle",
  "shotgun",
];

/** Reserve rounds every human starts the run with: about two magazines */
export const STARTING_RESERVE: Record<LimitedAmmoClass, number> = {
  rifle: 60,
  shotgun: 14,
};

/** Extra reserve a primary gun comes with the first time it's picked up */
export const NEW_GUN_RESERVE_BONUS: Record<LimitedAmmoClass, number> = {
  rifle: 15,
  shotgun: 4,
};

/** Rounds in an ammo box (`AmmoPickup`) */
export const AMMO_PICKUP_AMOUNT: Record<LimitedAmmoClass, number> = {
  rifle: 45,
  shotgun: 12,
};

/** Most reserve rounds one human can carry */
export const MAX_RESERVE: Record<LimitedAmmoClass, number> = {
  rifle: 240,
  shotgun: 48,
};

/** Chance that an enemy drops an ammo box when it dies */
export const AMMO_DROP_CHANCE = 0.03;
/** Chance per kill with the Scavenger upgrade, on top of `AMMO_DROP_CHANCE` */
export const SCAVENGER_DROP_CHANCE = 0.15;

export function isLimitedAmmo(
  ammoClass: AmmoClass,
): ammoClass is LimitedAmmoClass {
  return ammoClass !== "pistol";
}

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
