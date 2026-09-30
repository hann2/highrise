import { PositionalSound } from "../../../core/sound/PositionalSound";
import { degToRad } from "../../../core/util/MathUtil";
import { choose, rInteger, rNormal } from "../../../core/util/Random";
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
import { inflictDamageFrom } from "../../run/damageSources";
import EnemyVoice from "../base/EnemyVoice";
import SimpleEnemyController from "../base/SimpleEnemyController";
import { chooseDeathStyle, comeApart } from "../remains/comeApart";
import type { DeathBlow } from "../base/DeathBlow";
import { SPRINTER_VARIANTS, ZombieVariant } from "../zombie/ZombieVariants";
import SprinterSprite from "./SprinterSprite";

const SPEED = 8;
const HEALTH = 60;

export const RUNNER_RADIUS = ZOMBIE_RADIUS * 0.8;
/** A bit darker than a zombie */
export const SPRINTER_TINT = 0xdddddd;

const ATTACK_RANGE = RUNNER_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE_RANGE = degToRad(90);

const hitSoundRing = new ShuffleRing(ZOMBIE_ATTACK_HIT_SOUNDS);

export default class Sprinter extends BaseEnemy {
  tags = ["zombie"];
  bodySprite: SprinterSprite;
  hp: number = rNormal(HEALTH, HEALTH / 5);

  constructor(
    position: V2d,
    public zombieVariant: ZombieVariant = choose(...SPRINTER_VARIANTS),
  ) {
    super(position);

    this.walkSpring.speed = rNormal(SPEED, SPEED / 5);

    this.addChild(new SimpleEnemyController(this, ATTACK_RANGE, ZOMBIE_RADIUS));
    this.bodySprite = this.addChild(new SprinterSprite(this));
  }

  handleDeath(blow: DeathBlow) {
    this.voice.speak("death", true);
    comeApart(
      this.game,
      blow,
      chooseDeathStyle(blow, this.bodySprite.getPartPoses(), true),
      {
        sprite: this.bodySprite,
        lying: this.zombieVariant.crawlerTextures,
        legs: this.zombieVariant.legs,
        radius: RUNNER_RADIUS * 0.9,
        velocity: this.body.velocity,
        tint: SPRINTER_TINT,
        burning: this.burning,
      },
    );
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
        if (this.isAdded) {
          for (const human of getHumansInRange(
            this.game,
            this.body.position,
            this.body.angle,
            ATTACK_RANGE,
            ATTACK_ANGLE_RANGE,
          )) {
            inflictDamageFrom(human, rInteger(10, 15), this);
            this.game.addEntity(
              new PositionalSound(hitSoundRing.getNext(), this.getPosition(), {
                speed: rNormal(1, 0.05),
              }),
            );
          }
        }
      },
    });
  }
}
