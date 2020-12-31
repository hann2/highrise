import Game from "../../../core/Game";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { normalizeAngle, polarToVec } from "../../../core/util/MathUtil";
import { choose, rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { SPITTER_SOUNDS } from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import DeathOrb from "../../projectiles/DeathOrb";
import Phlegm from "../../projectiles/Phlegm";
import { BaseEnemy } from "../base/Enemy";
import { makeSimpleEnemyBody } from "../base/enemyUtils";
import Zombie from "../zombie/Zombie";
import NecromancerController from "./NecromancerController";
import NecromancerSprite from "./NecromancerSprite";
import { ZombieEgg } from "./ZombieEgg";

export const NECROMANCER_RADIUS = 0.5;

const SPEED = 4;
const HEALTH = 2000;

const WINDUP_TIME = 1; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.2; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 3; // Time after windown before starting another attack
const MAX_MINIONS = 8; // Maximum number of zombies to have at once

type AbilityName = keyof Necromancer["abilities"];

export default class Necromancer extends BaseEnemy {
  hp: number = HEALTH;
  minions: BaseEnemy[] = [];

  constructor(
    position: V2d,
    public arenaUpperLeftCorner: V2d,
    public arenaDimensions: V2d
  ) {
    super(position);

    this.walkSpring.speed = SPEED;

    this.addChild(new NecromancerController(this));
    this.addChild(new NecromancerSprite(this));

    for (const ability of Object.values(this.abilities)) {
      this.addChild(ability);
    }
  }

  makeBody(position: V2d) {
    const body = makeSimpleEnemyBody(position, NECROMANCER_RADIUS, 40);
    body.damping = 10;
    return body;
  }

  onAdd(game: Game) {
    super.onAdd(game);

    this.aimSpring.stiffness = 50;
    this.aimSpring.damping = 5;
  }

  // Override this because we do something more complicatd than a single attack
  makeAttackAction() {
    return undefined;
  }

  async fireDeathOrb() {
    if (this.getAttackPhase() === "ready") {
      const ability = this.abilities.fireDeathOrb;
      this.attackAction = ability;
      ability.do();
    }
  }

  async firePhlegm() {
    if (this.getAttackPhase() === "ready") {
      const ability = this.abilities.firePhlegm;
      this.attackAction = ability;
      ability.do();
    }
  }

  async surround(targetPosition: V2d) {
    if (this.getAttackPhase() === "ready") {
      const ability = this.abilities.surround;
      this.attackAction = ability;
      ability.do({ targetPosition });
    }
  }

  async summonShield(direction?: V2d) {
    if (this.getAttackPhase() === "ready") {
      const ability = this.abilities.summonShield;
      this.attackAction = ability;
      ability.do(direction);
    }
  }

  getCurrentAbility(): AbilityName | undefined {
    if (!this.attackAction) {
      return undefined;
    }

    for (const abilityName of Object.keys(this.abilities) as AbilityName[]) {
      if (this.attackAction === this.abilities[abilityName]) {
        return abilityName;
      }
    }
  }

  getMinionCount(): number {
    this.minions = this.minions.filter((minion) => !minion.isDestroyed);
    return this.minions.length;
  }

  // TODO: I'm not sure that this refactoring was actually beneficial. It seems like it might be more limiting
  // than what was here before without much benefit

  // All the different things we can do
  abilities = {
    // A basic attack, launches a projectile at the target
    fireDeathOrb: createAttackAction({
      windupDuration: WINDUP_TIME * 0.7,
      attackDuration: 0,
      windDownDuration: WINDDOWN_TIME * 0.8,
      cooldownDuration: COOLDOWN_TIME * 0.8,

      onAttack: () => {
        this.addChild(new DeathOrb(this.getPosition(), this.body.angle));

        const sound = choose(...SPITTER_SOUNDS.attack);
        this.game?.addEntity(new PositionalSound(sound, this.getPosition()));
      },
    }),

    // A basic attack, launches a few projectiles at the target
    firePhlegm: createAttackAction({
      windupDuration: WINDUP_TIME,
      attackDuration: 1.0,
      windDownDuration: WINDDOWN_TIME,
      cooldownDuration: COOLDOWN_TIME,

      onAttack: async () => {
        for (let i = 0; i < 5; i++) {
          this.addChild(
            new Phlegm(this.getPosition(), this.body.angle + rNormal(0, 0.3))
          );
          const sound = choose(...SPITTER_SOUNDS.attack);
          this.game?.addEntity(new PositionalSound(sound, this.getPosition()));
          await this.wait(0.1);
        }
      },
    }),

    // Summons a shield of zombies around the necromancer
    summonShield: createAttackAction({
      windupDuration: WINDUP_TIME,
      attackDuration: 0,
      windDownDuration: WINDDOWN_TIME,
      cooldownDuration: COOLDOWN_TIME,

      onAttack: (direction: V2d = polarToVec(rUniform(0, 2 * Math.PI), 1)) => {
        const nZombies = 5; // TODO: Limit number of minions
        const separation = Math.PI / 5;
        const angles: number[] = [];
        for (let i = 0; i < nZombies; i++) {
          angles.push(normalizeAngle(separation * (i - nZombies / 2)));
        }

        const eggs = angles
          .map((angle) => this.getPosition().add(direction.rotate(angle)))
          .map(
            (position) => new ZombieEgg(this.getPosition(), position, "zombie")
          );

        this.game!.addEntities(eggs);
      },
    }),

    // Throws zombie eggs at an enemy
    surround: createAttackAction({
      windupDuration: WINDUP_TIME,
      attackDuration: 0,
      windDownDuration: WINDDOWN_TIME,
      cooldownDuration: COOLDOWN_TIME,

      onAttack: ({ targetPosition }: { targetPosition: V2d }) => {
        const angles: number[] = [];
        const nCrawlers = 7;
        const startingAngle = rUniform(0, Math.PI * 2);
        for (let i = 0; i < nCrawlers; i++) {
          angles.push(
            normalizeAngle(startingAngle + (i * Math.PI * 2) / nCrawlers)
          );
        }

        const eggs = angles
          .map((angle) => targetPosition.add(polarToVec(angle, 2)))
          .map(
            (target) => new ZombieEgg(this.getPosition(), target, "crawler")
          );

        this.game!.addEntities(eggs);
      },
    }),
  };
}
