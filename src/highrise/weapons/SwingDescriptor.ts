import {
  degToRad,
  lerp,
  polarToVec,
  smootherStep,
} from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";

export enum SwingPhase {
  WindUp,
  Swing,
  WindDown,
}

export type SwingDurations = [windup: number, swing: number, winddown: number];
export type SwingAngles = [rest: number, start: number, end: number];

export class SwingDescriptor {
  constructor(
    public swingDurations: SwingDurations = [0.2, 0.6, 0.2],
    // Angles of rest, swing start, and swing end
    public angles: SwingAngles = [0, degToRad(90), degToRad(-90)],
    // Maximum distance arms travel from rest
    public maxExtension: number = 0,
    // Handle position while resting
    public restPosition: [number, number] = [0, 0],
    // Handle position while swinging
    public swingPosition: [number, number] = [0, 0]
  ) {}

  // Total duration of the swing in seconds
  get duration() {
    return this.windUpDuration + this.swingDuration + this.windDownDuration;
  }

  get windUpDuration() {
    return this.swingDurations[0];
  }

  get swingDuration() {
    return this.swingDurations[1];
  }

  get windDownDuration() {
    return this.swingDurations[2];
  }

  // Time when the windup starts
  get windupStartTime() {
    return 0;
  }

  // Time when the swing starts
  get swingStartTime() {
    return this.windUpDuration;
  }

  // Time when the wind down starts
  get windDownStartTime() {
    return this.swingStartTime + this.swingDuration;
  }

  // Which part of the swing we're in
  getPhase(seconds: number) {
    if (seconds < this.windUpDuration) {
      return SwingPhase.WindUp;
    } else if (seconds < this.windDownStartTime) {
      return SwingPhase.Swing;
    } else {
      return SwingPhase.WindDown;
    }
  }

  // Returns the percent of the way through the current phase
  getPhasePercent(seconds: number) {
    if (seconds < this.windUpDuration) {
      return seconds / this.windUpDuration;
    } else if (seconds < this.windDownStartTime) {
      return (seconds - this.swingStartTime) / this.swingDuration;
    } else {
      return (seconds - this.windDownStartTime) / this.windDownDuration;
    }
  }

  // Angle while not swinging
  get restAngle() {
    return this.angles[0];
  }

  // Angle at the beginning of the swing
  get swingStartAngle() {
    return this.angles[1];
  }

  // Angle at the end of the swing
  get swingEndAngle() {
    return this.angles[2];
  }

  // Get the angle of the weapon at a point during the swing
  getAngle(seconds: number) {
    const phase = this.getPhase(seconds);
    const t = this.getPhasePercent(seconds);
    const { restAngle, swingStartAngle, swingEndAngle } = this;

    switch (phase) {
      case SwingPhase.WindUp:
        return lerp(restAngle, swingStartAngle, smootherStep(t));
      case SwingPhase.Swing:
        return lerp(swingStartAngle, swingEndAngle, smootherStep(t));
      case SwingPhase.WindDown:
        return lerp(swingEndAngle, restAngle, smootherStep(t));
    }
  }

  getExtensionPercent(seconds: number): number {
    const phase = this.getPhase(seconds);
    const t = this.getPhasePercent(seconds);

    switch (phase) {
      case SwingPhase.WindUp:
        return lerp(0, 0.5, t);
      case SwingPhase.Swing:
        return 0.5 + 0.5 * Math.sin(t * Math.PI);
      case SwingPhase.WindDown:
        return lerp(0.5, 0, t);
    }
  }

  getHandlePosition(seconds: number): V2d {
    const angle = this.getAngle(seconds);
    const t = this.getExtensionPercent(seconds);

    // The center of the swing arc
    const swingCenter = V(this.restPosition).lerp(this.swingPosition, t);

    // The offset of the handle from the swing center
    const extension = polarToVec(angle, t * this.maxExtension);

    return swingCenter.iadd(extension);
  }
}
