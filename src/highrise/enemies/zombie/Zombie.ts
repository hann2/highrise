import { PositionalSound } from "../../../core/sound/PositionalSound";
import { degToRad } from "../../../core/util/MathUtil";
import { choose, rBool, rInteger, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import {
  HUMAN_RADIUS,
  ZOMBIE_ATTACK_HIT_SOUNDS,
  ZOMBIE_RADIUS,
} from "../../constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import { ShuffleRing } from "../../utils/ShuffleRing";
import { BaseEnemy } from "../base/Enemy";
import { getHumansInRange } from "../base/enemyUtils";
import EnemyVoice from "../base/EnemyVoice";
import SimpleEnemyController from "../base/SimpleEnemyController";
import Crawler from "../crawler/Crawler";
import ZombieSprite from "./ZombieSprite";
import { ZombieVariant, ZOMBIE_VARIANTS } from "./ZombieVariants";

const SPEED = 0.4;

const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE_RANGE = degToRad(90);
const CRAWLER_CHANCE = 0.35; // Chance to turn into a crawler on death

const hitSoundRing = new ShuffleRing(ZOMBIE_ATTACK_HIT_SOUNDS);

export default class Zombie extends BaseEnemy {
  tags = ["zombie"];
  walkSpeed: number = rNormal(SPEED, SPEED / 5);

  constructor(
    position: V2d,
    public zombieVariant: ZombieVariant = choose(...ZOMBIE_VARIANTS)
  ) {
    super(position);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, ZOMBIE_RADIUS));
    this.addChild(new ZombieSprite(this));
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), this.zombieVariant.sounds);
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
