import { PositionalSound } from "../../../core/sound/PositionalSound";
import { degToRad } from "../../../core/util/MathUtil";
import { choose, rBool, rInteger, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import {
  HUMAN_RADIUS,
  ZOMBIE_ATTACK_HIT_SOUNDS,
  ZOMBIE_RADIUS,
} from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { ShuffleRing } from "../../utils/ShuffleRing";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange, makeSimpleEnemyBody } from "../base/enemyUtils";
import EnemyVoice from "../base/EnemyVoice";
import SimpleEnemyController from "../base/SimpleEnemyController";
import Crawler from "../crawler/Crawler";
import { SPRINTER_VARIANTS, ZombieVariant } from "../zombie/ZombieVariants";
import SprinterSprite from "./SprinterSprite";

const SPEED = 0.6;
const HEALTH = 60;

export const RUNNER_RADIUS = ZOMBIE_RADIUS * 0.8;

const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE_RANGE = degToRad(90);
const CRAWLER_CHANCE = 0.35; // Chance to turn into a crawler on death

const hitSoundRing = new ShuffleRing(ZOMBIE_ATTACK_HIT_SOUNDS);

export default class Sprinter extends BaseEnemy {
  tags = ["zombie"];
  hp: number = rNormal(HEALTH, HEALTH / 5);
  walkSpeed: number = rNormal(SPEED, SPEED / 5);

  constructor(
    position: V2d,
    public zombieVariant: ZombieVariant = choose(...SPRINTER_VARIANTS)
  ) {
    super(position);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, ZOMBIE_RADIUS));
    this.addChild(new SprinterSprite(this));
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), this.zombieVariant.sounds);
  }

  makeBody(position: [number, number]) {
    return makeSimpleEnemyBody(position, RUNNER_RADIUS, 0.8);
  }

  makeAttackAction() {
    return createAttackAction({
      windupDuration: 0.16,
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
            this.game?.addEntity(
              new PositionalSound(hitSoundRing.getNext(), this.getPosition(), {
                speed: rNormal(1, 0.05),
              })
            );
          }
        }
      },
    });
  }

  onDie() {
    super.onDie();

    if (rBool(CRAWLER_CHANCE)) {
      this.game?.addEntity(
        new Crawler(
          this.getPosition(),
          this.body.angle,
          this.zombieVariant.crawlerTextures
        )
      );
    }
  }
}
