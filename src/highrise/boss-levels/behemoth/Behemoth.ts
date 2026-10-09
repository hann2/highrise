import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { rInteger, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import {
  HUMAN_RADIUS,
  PERRY_ZOMBIE_SOUNDS,
  ZOMBIE_ATTACK_HIT_SOUNDS,
} from "../../constants/constants";
import { createAttackAction } from "../../creature-stuff/AttackAction";
import FleshImpact from "../../effects/FleshImpact";
import { BaseEnemy } from "../../enemies/base/Enemy";
import {
  getHumansInRange,
  makeSimpleEnemyBody,
} from "../../enemies/base/enemyUtils";
import EnemyVoice from "../../enemies/base/EnemyVoice";
import { HEAVY_RADIUS } from "../../enemies/heavy/Heavy";
import HeavySprite from "../../enemies/heavy/HeavySprite";
import type Human from "../../human/Human";
import { inflictDamageFrom } from "../../run/damageSources";
import { ShuffleRing } from "../../utils/ShuffleRing";
import BehemothController from "./BehemothController";

/** A heavy more than twice the size */
export const BEHEMOTH_RADIUS = HEAVY_RADIUS * 2.2;
const HEALTH = 5000;
const SPEED = 3;
const MASS = 30;
/** How far its slam reaches, from its middle (meters) */
export const SLAM_RANGE = BEHEMOTH_RADIUS + HUMAN_RADIUS + 0.6;
/** How hard a slam or a charge throws someone (meters per second) */
const SLAM_THROW = 7;

const hitSoundRing = new ShuffleRing(ZOMBIE_ATTACK_HIT_SOUNDS);

/**
 * The final boss, for now: a heavy grown huge. It walks you down and slams
 * whatever's in front of it, and every so often stops, lines up and charges
 * in a straight line, flattening anyone in the way; charging into a wall
 * leaves it dazed (see `BehemothController`). Only its own charges stun it:
 * blows and bullets don't.
 */
export default class Behemoth extends BaseEnemy {
  tags = ["boss"];
  hp = HEALTH;
  controller: BehemothController;
  /** Its stun is its own doing (a charge into a wall), not a blow's */
  stunnedBySelf = false;

  constructor(position: V2d, angle: number = 0) {
    super(position);
    this.body.angle = angle;
    this.walkSpring.speed = SPEED;
    this.controller = this.addChild(new BehemothController(this));
    this.addChild(new HeavySprite(this, BEHEMOTH_RADIUS));
  }

  @on("add")
  onAdd() {
    super.onAdd();
    this.aimSpring.stiffness = 20;
    this.aimSpring.damping = 8;
  }

  @on("tick")
  onTick(dt: number) {
    // Shrugs off what would stun anything else
    if (!this.stunnedBySelf) {
      this.stunnedTimer = 0;
    }
    super.onTick(dt);
    if (this.stunnedTimer <= 0) {
      this.stunnedBySelf = false;
    }
  }

  /** Dazed for `duration` seconds, by its own doing */
  daze(duration: number) {
    this.stunnedBySelf = true;
    this.stun(duration);
  }

  stun(duration: number) {
    if (this.stunnedBySelf) {
      super.stun(duration);
    }
  }

  knockback(impulse: V2d, relativePos?: V2d) {
    super.knockback(impulse.mul(0.15), relativePos);
  }

  makeBody(position: [number, number]) {
    return makeSimpleEnemyBody(position, BEHEMOTH_RADIUS, MASS);
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), PERRY_ZOMBIE_SOUNDS);
  }

  handleDeath() {
    this.game.addEntity(new FleshImpact(this.getPosition(), 20));
    this.voice.speak("death", true);
  }

  /** Hurts `human` and throws them away from it */
  hit(human: Human, damage: number) {
    inflictDamageFrom(human, damage, this);
    const away = human.getPosition().sub(this.getPosition()).inormalize();
    human.body.applyImpulse(away.imul(SLAM_THROW * human.body.mass));
    this.game.addEntity(
      new PositionalSound(hitSoundRing.getNext(), this.getPosition(), {
        speed: rNormal(0.55, 0.05),
      }),
    );
  }

  makeAttackAction() {
    return createAttackAction({
      windupDuration: 0.55,
      attackDuration: 0.15,
      windDownDuration: 0.25,
      cooldownDuration: 0.7,
      onWindupStart: () => {
        this.voice.speak("attack");
      },
      onAttack: () => {
        if (this.isAdded) {
          for (const human of getHumansInRange(
            this.game,
            this.body.position,
            this.body.angle,
            SLAM_RANGE,
          )) {
            this.hit(human, rInteger(35, 50));
          }
        }
      },
    });
  }
}
