import { rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { SPITTER_SOUNDS } from "../../constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import GooImpact from "../../effects/GooImpact";
import Phlegm from "../../projectiles/Phlegm";
import { BaseEnemy } from "../base/Enemy";
import EnemyVoice from "../base/EnemyVoice";
import SpitterController from "./SpitterController";
import SpitterSprite from "./SpitterSprite";

const SPEED = 0.3;
const HEALTH = 100;

const FRICTION = 0.1;
export const SPITTER_ATTACK_RANGE = 10;
const WINDUP_TIME = 0.3; // Time in animation from beginning of attack to becoming uncancellable
const ATTACK_TIME = 0.1; // Time in animation from doing starting actual attack to doing damage
const WINDDOWN_TIME = 0.6; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 0.8; // Time after windown before starting another attack

const PHLEGM_SPEED = 8; // Meters / second
const DAMAGE = 20;

export default class Spitter extends BaseEnemy {
  tags = ["zombie"];
  hp: number = HEALTH;
  speed: number = rNormal(SPEED, SPEED / 5);

  constructor(position: V2d, angle: number = rUniform(0, Math.PI * 2)) {
    super(position);

    this.addChild(new SpitterController(this));
    this.addChild(new SpitterSprite(this));
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), SPITTER_SOUNDS);
  }

  makeAttackAction() {
    return createAttackAction({
      windupDuration: WINDUP_TIME,
      attackDuration: ATTACK_TIME,
      windDownDuration: WINDDOWN_TIME,
      cooldownDuration: COOLDOWN_TIME,
      onWindupStart: () => {
        this.voice.speak("attack");
      },
      onAttack: () => {
        if (this.game) {
          this.game!.addEntity(
            new Phlegm(
              this.getPosition(),
              this.body.angle,
              PHLEGM_SPEED,
              DAMAGE,
              this
            )
          );
        }
      },
    });
  }

  get isStunned() {
    return this.stunnedTimer > 0;
  }

  onTick(dt: number) {
    if (this.stunnedTimer > 0) {
      this.stunnedTimer -= dt;
    }

    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  makeBlood(position: V2d, damage: number, normal?: V2d) {
    this.game?.addEntity(new GooImpact(position, damage / 10, normal));
  }

  onDie() {
    super.onDie();
    this.game?.addEntity(new GooImpact(this.getPosition(), 5));
    this.voice.speak("death");
  }
}
