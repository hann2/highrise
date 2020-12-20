import { PhasedAction } from "../utils/PhasedAction";

export type AttackPhases = "windup" | "attack" | "winddown" | "cooldown";

interface Options<Params extends unknown[] = []> {
  windupDuration?: number;
  attackDuration?: number;
  windDownDuration?: number;
  cooldownDuration?: number;
  onWindupStart?: (...options: Params) => void;
  onAttack?: (...options: Params) => void;
}

export function createAttackAction<Params extends unknown[] = []>({
  windupDuration = 0.2,
  attackDuration = 0.2,
  windDownDuration = 0.2,
  cooldownDuration = 0.2,
  onWindupStart,
  onAttack,
}: Options<Params>): PhasedAction<AttackPhases, Params> {
  return new PhasedAction<AttackPhases, Params>([
    {
      name: "windup",
      duration: windupDuration,
      startAction: onWindupStart,
    },
    {
      name: "attack",
      duration: attackDuration,
      endAction: onAttack,
    },
    {
      name: "winddown",
      duration: windDownDuration,
    },
    {
      name: "cooldown",
      duration: cooldownDuration,
    },
  ]);
}
