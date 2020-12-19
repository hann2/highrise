import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";

interface Phase<name extends string, Params extends Array<unknown> = []> {
  name: name;
  duration: number;
  startAction?: (...options: Params) => void;
  endAction?: (...options: Params) => void;
}

export class PhasedAction<
    PhaseName extends string,
    Params extends unknown[] = []
  >
  extends BaseEntity
  implements Entity {
  currentPhase?: Phase<PhaseName, Params> = undefined;
  phasePercent: number = 0;

  constructor(public phases: Phase<PhaseName, Params>[]) {
    super();
  }

  isActive() {
    return this.currentPhase != undefined;
  }

  reset() {
    this.clearTimers();
    this.currentPhase = undefined;
  }

  // Do the whole action start-to-finish
  async do(...params: Params) {
    for (const phase of this.phases) {
      await this.doPhase(phase, ...params);
    }

    this.reset();
  }

  // Do just one phase
  async doSinglePhase(phaseName: PhaseName, ...options: Params) {
    const phase = this.phases.find((phase) => phase.name === phaseName)!;
    await this.doPhase(phase, ...options);
    this.reset();
  }

  // Do one phase of the action
  private async doPhase(phase: Phase<PhaseName, Params>, ...params: Params) {
    this.currentPhase = phase;

    console.log("doing phase", phase.name, phase.duration);
    this.phasePercent = 0;
    phase.startAction?.(...params);

    if (phase.duration) {
      await this.wait(
        phase.duration,
        (dt, t) => {
          this.phasePercent = t;
        },
        phase.name
      );
    }

    this.phasePercent = 1;
    phase.endAction?.(...params);
  }
}
