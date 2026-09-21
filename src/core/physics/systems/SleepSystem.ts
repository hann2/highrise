import type { Body } from "../body/Body";

/**
 * Tick sleep state for a single dynamic body. Delegates to the body's
 * composed SleepBehavior. No-op on non-dynamic bodies.
 */
export function sleepTick(
  body: Body,
  time: number,
  dontSleep: boolean,
  dt: number,
): void {
  if (body.motion !== "dynamic") return;
  body._sleep.sleepTick(body, time, dontSleep, dt);
}

/** Wake a body up (idempotent). */
export function wakeUp(body: Body): void {
  body.wakeUp();
}

/** Force a body to sleep (zeroes velocities and forces). */
export function sleep(body: Body): void {
  body.sleep();
}

/**
 * Top-level driver: tick sleep for every dynamic body in the given bag.
 * Callers pass `world.bodies.dynamicAwake` (or any dynamic-body iterator).
 */
export function updateSleeping(
  bodies: Iterable<Body>,
  time: number,
  dt: number,
  dontSleep: boolean = false,
): void {
  for (const body of bodies) {
    if (body.motion !== "dynamic") continue;
    body._sleep.sleepTick(body, time, dontSleep, dt);
  }
}
