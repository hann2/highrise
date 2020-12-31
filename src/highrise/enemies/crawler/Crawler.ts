import { degToRad } from "../../../core/util/MathUtil";
import { rInteger, rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { BodyTextures } from "../../creature-stuff/BodySprite";
import { BaseEnemy as BaseEnemy } from "../base/Enemy";
import { getHumansInRange } from "../base/enemyUtils";
import SimpleEnemyController from "../base/SimpleEnemyController";
import CrawlerSprite from "./CrawlerSprite";

const SPEED = 1.0;

const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE_RANGE = degToRad(90);

export default class Crawler extends BaseEnemy {
  tags = ["zombie", "crawler"];
  hp: number = rInteger(50, 80);

  constructor(
    position: V2d,
    angle: number = rUniform(0, Math.PI * 2),
    textures?: BodyTextures
  ) {
    super(position);

    this.body.angle = angle;
    this.walkSpring.speed = rNormal(SPEED, SPEED / 5);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, ZOMBIE_RADIUS));
    this.addChild(new CrawlerSprite(this, textures));
  }

  makeAttackAction() {
    return createAttackAction({
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
    });
  }
}
