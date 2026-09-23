import { degToRad } from "../../../core/util/MathUtil";
import { rDirection, rInteger, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { BodyTextures } from "../../creature-stuff/BodySprite";
import type Human from "../../human/Human";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange } from "../base/enemyUtils";
import { inflictDamageFrom } from "../../run/damageSources";
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
    angle: number = rDirection(),
    textures?: BodyTextures,
  ) {
    super(position);

    this.body.angle = angle;
    this.walkSpring.speed = rNormal(SPEED, SPEED / 5);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, ZOMBIE_RADIUS));
    this.addChild(new CrawlerSprite(this, textures));
  }

  diesInOneHitFrom(attacker?: Human): boolean {
    return attacker?.stats.oneHitCrawlers ?? false;
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
        if (this.isAdded) {
          for (const human of getHumansInRange(
            this.game,
            this.body.position,
            this.body.angle,
            ATTACK_RANGE,
            ATTACK_ANGLE_RANGE,
          )) {
            inflictDamageFrom(human, rInteger(10, 15), this);
          }
        }
      },
    });
  }
}
