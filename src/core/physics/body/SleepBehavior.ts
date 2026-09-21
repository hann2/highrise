import type { V2d } from "../../Vector";
import { SleepState } from "./Body";

/**
 * Minimal interface for what SleepBehavior needs from its host body.
 * Avoids circular dependencies and makes testing easier.
 */
export interface SleepableBody {
  readonly velocity: V2d;
  angularVelocity: number;
  angularForce: number;
  readonly force: V2d;
  readonly world: {
    bodies: { onSleepStateChanged(body: unknown): void };
  } | null;
  emit(event: { type: "sleep"; body: unknown }): unknown;
  emit(event: { type: "wakeup"; body: unknown }): unknown;
}

/** Configuration for SleepBehavior. */
export interface SleepConfig {
  /** Whether this body can sleep when idle. */
  allowSleep: boolean;
  /** Speed below which body becomes sleepy. */
  sleepSpeedLimit: number;
  /** Seconds of low speed before sleeping. */
  sleepTimeLimit: number;
}

/**
 * Manages sleep state for a dynamic body.
 * Bodies that are idle (moving slowly) can be put to sleep to save computation.
 */
export class SleepBehavior {
  private _sleepState: SleepState = SleepState.AWAKE;
  private _allowSleep: boolean;
  private _sleepSpeedLimit: number;
  private _sleepTimeLimit: number;
  private _wantsToSleep: boolean = false;

  /** Time spent below sleep speed limit. */
  idleTime: number = 0;
  /** @internal */
  timeLastSleepy: number = 0;

  constructor(config: SleepConfig) {
    this._allowSleep = config.allowSleep;
    this._sleepSpeedLimit = config.sleepSpeedLimit;
    this._sleepTimeLimit = config.sleepTimeLimit;
  }

  /** Current sleep state. */
  get sleepState(): SleepState {
    return this._sleepState;
  }

  /** Whether this body is allowed to sleep. */
  get allowSleep(): boolean {
    return this._allowSleep;
  }

  /** Speed threshold below which body becomes sleepy. */
  get sleepSpeedLimit(): number {
    return this._sleepSpeedLimit;
  }

  /** @internal True if body is ready to sleep (used for island sleeping). */
  get wantsToSleep(): boolean {
    return this._wantsToSleep;
  }

  /** Returns true if the body is currently sleeping. */
  isSleeping(): boolean {
    return this._sleepState === SleepState.SLEEPING;
  }

  /** Returns true if the body is currently awake. */
  isAwake(): boolean {
    return this._sleepState === SleepState.AWAKE;
  }

  /**
   * Wake the body up.
   * @param body - The host body (for event emission and world notification)
   */
  wakeUp(body: SleepableBody): void {
    if (!this.isAwake()) {
      this._sleepState = SleepState.AWAKE;
      this.idleTime = 0;
      body.world?.bodies.onSleepStateChanged(body);
      body.emit({ type: "wakeup", body });
    }
  }

  /**
   * Force body to sleep.
   * @param body - The host body (for velocity clearing and event emission)
   */
  sleep(body: SleepableBody): void {
    this._sleepState = SleepState.SLEEPING;
    body.angularVelocity = 0;
    body.angularForce = 0;
    body.velocity.set(0, 0);
    body.force.set(0, 0);
    body.world?.bodies.onSleepStateChanged(body);
    body.emit({ type: "sleep", body });
  }

  /**
   * Called every timestep to update internal sleep timer and change sleep state if needed.
   * @param body - The host body (for velocity reading)
   * @param time - Current simulation time (unused but kept for API compat)
   * @param dontSleep - If true, don't actually sleep, just set wantsToSleep
   * @param dt - Time step
   */
  sleepTick(
    body: SleepableBody,
    time: number,
    dontSleep: boolean,
    dt: number,
  ): void {
    if (!this._allowSleep || this._sleepState === SleepState.SLEEPING) {
      return;
    }

    this._wantsToSleep = false;

    const speedSquared =
      body.velocity.squaredMagnitude + Math.pow(body.angularVelocity, 2);
    const speedLimitSquared = Math.pow(this._sleepSpeedLimit, 2);

    if (speedSquared >= speedLimitSquared) {
      this.idleTime = 0;
      this._sleepState = SleepState.AWAKE;
    } else {
      this.idleTime += dt;
      this._sleepState = SleepState.SLEEPY;
    }

    if (this.idleTime > this._sleepTimeLimit) {
      if (!dontSleep) {
        this.sleep(body);
      } else {
        this._wantsToSleep = true;
      }
    }
  }
}
