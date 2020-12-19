import { rInteger, rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange, makeSimpleEnemyBody } from "../base/enemyUtils";
import Zombie from "../zombie/Zombie";
import ZombieController from "../zombie/ZombieController";
import HeavySprite from "./HeavySprite";

const SPEED = 0.2;
const ATTACK_RANGE = HUMAN_RADIUS + ZOMBIE_RADIUS;

export default class Heavy extends BaseEnemy {
  walkSpeed: number = rNormal(SPEED, SPEED / 10);
  hp = rInteger(400, 500);
  stunnedTimer = 0;

  constructor(position: V2d, angle: number = rUniform(0, Math.PI * 2)) {
    super(position);

    // TODO: This is sketchy
    this.addChild(new ZombieController((this as any) as Zombie));
    this.addChild(new HeavySprite(this));
  }

  makeBody(position: [number, number]) {
    return makeSimpleEnemyBody(position, ZOMBIE_RADIUS * 2);
  }

  makeAttackAction() {
    return this.addChild(
      createAttackAction({
        windupDuration: 0.2,
        attackDuration: 0.1,
        windDownDuration: 0.1,
        cooldownDuration: 0.5,
        onWindupStart: () => {
          this.voice.speak("attack");
        },
        onAttack: () => {
          if (this.game) {
            for (const human of getHumansInRange(
              this.game,
              this.body.position,
              this.body.angle,
              ATTACK_RANGE
            )) {
              human.inflictDamage(rInteger(10, 15));
            }
          }
        },
      })
    );
  }
}
