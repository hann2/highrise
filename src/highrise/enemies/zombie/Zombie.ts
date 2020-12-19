import { degToRad } from "../../../core/util/MathUtil";
import { choose, rBool, rInteger, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange } from "../base/enemyUtils";
import Crawler from "../crawler/Crawler";
import ZombieController from "./ZombieController";
import ZombieSprite from "./ZombieSprite";
import { ZombieVariant, ZOMBIE_VARIANTS } from "./ZombieVariants";

const SPEED = 0.4;

const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE_RANGE = degToRad(90);
const CRAWLER_CHANCE = 1.2; // Chance to turn into a crawler on death

export default class Zombie extends BaseEnemy {
  tags = ["zombie"];
  walkSpeed: number = rNormal(SPEED, SPEED / 5);
  controller: ZombieController;

  constructor(
    position: V2d,
    public zombieVariant: ZombieVariant = choose(...ZOMBIE_VARIANTS)
  ) {
    super(position);

    this.controller = this.addChild(new ZombieController(this));
    this.addChild(new ZombieSprite(this));
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
              ATTACK_RANGE,
              ATTACK_ANGLE_RANGE
            )) {
              human.inflictDamage(rInteger(10, 15));
            }
          }
        },
      })
    );
  }

  onDie() {
    super.onDie();

    if (rBool(CRAWLER_CHANCE)) {
      this.game?.addEntity(new Crawler(this.getPosition(), this.body.angle));
    }
  }
}
