import Game from "../../../core/Game";
import { normalizeAngle, polarToVec } from "../../../core/util/MathUtil";
import { rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import DeathOrb from "../../projectiles/DeathOrb";
import { BaseEnemy } from "../base/Enemy";
import { makeSimpleEnemyBody } from "../base/enemyUtils";
import Crawler from "../crawler/Crawler";
import Zombie from "../zombie/Zombie";
import NecromancerController from "./NecromancerController";
import NecromancerSprite from "./NecromancerSprite";

export const NECROMANCER_RADIUS = 0.5;

const SPEED = 12;
const HEALTH = 2000;

const WINDUP_TIME = 1; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.2; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 3; // Time after windown before starting another attack
const MAX_MINIONS = 8; // Maximum number of zombies to have at once

type AbilityName = keyof Necromancer["abilities"];

export default class Necromancer extends BaseEnemy {
  hp: number = HEALTH;
  walkSpeed: number = SPEED;
  walkFriction: number = 0.3;

  minions: BaseEnemy[] = [];

  constructor(
    position: V2d,
    public arenaUpperLeftCorner: V2d,
    public arenaDimensions: V2d
  ) {
    super(position);

    this.addChild(new NecromancerController(this));
    this.addChild(new NecromancerSprite(this));

    for (const ability of Object.values(this.abilities)) {
      this.addChild(ability);
    }
  }

  makeBody(position: V2d) {
    const body = makeSimpleEnemyBody(position, NECROMANCER_RADIUS, 10);
    body.damping = 10;
    return body;
  }

  onAdd(game: Game) {
    super.onAdd(game);

    this.aimSpring.stiffness = 50;
    this.aimSpring.damping = 5;
  }

  // Make the necromancer have less knockback
  knockback(impulse: [number, number], relativePos?: [number, number]) {
    super.knockback([impulse[0] * 0.1, impulse[1] * 0.1], relativePos);
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
      windupDuration: WINDUP_TIME,
      attackDuration: 0,
      windDownDuration: WINDDOWN_TIME,
      cooldownDuration: COOLDOWN_TIME,

      onAttack: () => {
        this.addChild(new DeathOrb(this.getPosition(), this.body.angle));
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

        const zombies = angles
          .map((angle) => this.getPosition().add(direction.rotate(angle)))
          .map((position) => new Zombie(position));

        this.minions.push(...zombies);
        this.game!.addEntities(zombies);
      },
    }),

    //
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

        const crawlers = angles
          .map((angle) => targetPosition.add(polarToVec(angle, 2)))
          .map((position) => new Crawler(position));
        this.minions.push(...crawlers);
        this.game!.addEntities(crawlers);
      },
    }),
  };
}
