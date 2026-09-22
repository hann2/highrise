import { on } from "../../../core/entity/handler";
import { rDirection, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { SPITTER_SOUNDS } from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import GooImpact from "../../effects/GooImpact";
import Phlegm from "../../projectiles/Phlegm";
import { BaseEnemy } from "../base/Enemy";
import EnemyVoice from "../base/EnemyVoice";
import SpitterController from "./SpitterController";
import SpitterSprite from "./SpitterSprite";

const SPEED = 0.22;
const HEALTH = 100;

const FRICTION = 0.1;
export const SPITTER_ATTACK_RANGE = 10;
const WINDUP_TIME = 0.3; // Time in animation from beginning of attack to becoming uncancellable
const ATTACK_TIME = 0.1; // Time in animation from doing starting actual attack to doing damage
const WINDDOWN_TIME = 0.6; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 0.8; // Time after windown before starting another attack

const PHLEGM_SPEED = 12; // Meters / second
const DAMAGE = 20;

export default class Spitter extends BaseEnemy {
  tags = ["zombie"];
  hp: number = HEALTH;

  constructor(position: V2d, angle: number = rDirection()) {
    super(position);

    this.walkSpring.speed = rNormal(SPEED, SPEED / 5);

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
          this.game.addEntity(
            new Phlegm(
              this.getPosition(),
              this.body.angle,
              PHLEGM_SPEED,
              DAMAGE,
              this,
            ),
          );
        }
      },
    });
  }

  @on("tick")
  onTick(dt: number) {
    super.onTick(dt);

    this.body.applyImpulse(this.body.velocity.mul(-FRICTION));
  }

  makeBlood(position: V2d, damage: number, normal?: V2d) {
    this.game?.addEntity(new GooImpact(position, damage / 10, normal));
  }

  handleDeath() {
    super.handleDeath();
    this.game?.addEntity(new GooImpact(this.getPosition(), 5));
    this.voice.speak("death");
  }
}
