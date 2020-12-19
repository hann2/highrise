import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { last } from "../../core/util/FunctionalUtils";

interface Phase<name extends string, Params extends Array<unknown> = []> {
  name: name;
  duration?: number;
  startAction?: (...options: Params) => void;
  endAction?: (...options: Params) => void;
}

export class PhasedAction<PhaseName extends string, Params extends unknown[]>
  extends BaseEntity
  implements Entity {
  currentPhase: Phase<PhaseName, Params>;
  defaultPhase: Phase<PhaseName, Params>;
  phasePercent: number = 0;

  constructor(
    public phases: Phase<PhaseName, Params>[],
    defaultPhaseName?: PhaseName
  ) {
    super();
    if (!defaultPhaseName) {
      this.defaultPhase = last(phases);
    } else {
      this.defaultPhase = phases.find(
        (phase) => phase.name === defaultPhaseName
      )!;
      if (!this.defaultPhase) {
        throw new Error(`invalid default phase: ${defaultPhaseName}`);
      }
    }

    this.currentPhase = this.defaultPhase;
  }

  reset() {
    this.clearTimers();
    this.currentPhase = this.defaultPhase;
  }

  async do(...options: Params) {
    for (const phase of this.phases) {
      this.currentPhase = phase;
      this.phasePercent = 0;
      phase.startAction?.(...options);
      if (phase.duration != undefined) {
        await this.wait(
          phase.duration,
          (dt, t) => {
            this.phasePercent = t;
          },
          phase.name
        );
      }
      this.phasePercent = 1;
      phase.endAction?.(...options);
    }

    this.reset();
  }
}
