import type Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import type { WithOwner } from "../../../core/entity/WithOwner";
import type { Body } from "../../../core/physics/body/Body";
import { AimSpring } from "../../../core/physics/springs/AimSpring";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { clamp, normalizeAngle } from "../../../core/util/MathUtil";
import { choose, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { RACHEL_ZOMBIE_SOUNDS } from "../../constants/constants";
import {
  AttackPhases,
  createAttackAction,
} from "../../creature-stuff/AttackAction";
import { Creature } from "../../creature-stuff/Creature";
import { WalkSpring } from "../../creature-stuff/WalkSpring";
import FleshImpact from "../../effects/FleshImpact";
import Hittable from "../../environment/Hittable";
import Human from "../../human/Human";
import Bullet from "../../projectiles/Bullet";
import { PhasedAction } from "../../utils/PhasedAction";
import SwingingWeapon from "../../weapons/melee/SwingingWeapon";
import { makeSimpleEnemyBody } from "./enemyUtils";
import EnemyVoice from "./EnemyVoice";

export class BaseEnemy extends Creature implements Hittable {
  hp: number = 100;
  aimSpring!: AimSpring;
  walkSpring: WalkSpring;
  body: Body & WithOwner;
  stunnedTimer: number = 0;
  voice!: EnemyVoice;
  attackAction?: PhasedAction<AttackPhases, any>;

  get isStunned() {
    return this.stunnedTimer > 0;
  }

  getAttackPhase() {
    return this.attackAction?.currentPhase?.name ?? "ready";
  }

  getAttackPhasePercent() {
    return this.attackAction?.phasePercent ?? 0;
  }

  setTargetDirection(angle: number) {
    angle = normalizeAngle(angle);
    this.aimSpring.restAngle = angle;
  }

  getTargetDirection(): number {
    return this.aimSpring.restAngle;
  }

  canWalk(): boolean {
    const attackPhase = this.getAttackPhase();
    return (
      !this.isStunned &&
      attackPhase !== "windup" &&
      attackPhase !== "attack" &&
      attackPhase !== "winddown"
    );
  }

  constructor(position: V2d) {
    super();

    this.body = this.makeBody(position);
    this.attackAction = this.makeAttackAction();
    if (this.attackAction != undefined) {
      this.addChild(this.attackAction);
    }
    this.walkSpring = this.addChild(new WalkSpring(this.body));
  }

  @on("add")
  onAdd() {
    this.voice = this.addChild(this.makeVoice());
    this.aimSpring = new AimSpring(this.body);
    this.springs = [this.aimSpring];
  }

  makeBody(position: V2d): Body {
    return makeSimpleEnemyBody(position, 0.3);
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), RACHEL_ZOMBIE_SOUNDS);
  }

  makeAttackAction(): PhasedAction<AttackPhases, any> | undefined {
    return createAttackAction({
      windupDuration: 0.2,
      attackDuration: 0.1,
      windDownDuration: 0.1,
      cooldownDuration: 0.5,
      onWindupStart: () => {
        this.voice.speak("attack");
      },
      onAttack: () => {},
    });
  }

  async attack() {
    if (this.attackAction && !this.attackAction.isActive()) {
      await this.attackAction.do();
    }
  }

  @on("tick")
  onTick(dt: number) {
    if (this.stunnedTimer > 0) {
      this.stunnedTimer -= dt;
    }
  }

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    const knockback = bullet.velocity.mul(bullet.stats.mass * 30);
    const relativePos = position.sub(this.body.position);
    this.knockback(knockback, relativePos);

    this.game?.addEntity(
      new PositionalSound(
        choose("fleshHit1", "fleshHit2", "fleshHit3"),
        position,
      ),
    );

    this.makeBlood(position, bullet.damage, normal);

    if (this.hp <= 0) {
      this.die(bullet.shooter);
    } else {
      this.voice.speak("hit");
    }

    return true;
  }

  knockback(impulse: V2d, relativePos?: V2d) {
    this.body.applyImpulse(impulse.mul(0.1), relativePos);
  }

  hitByMelee(swingingWeapon: SwingingWeapon, position: V2d) {
    const damageAmount = swingingWeapon.getDamage();
    const knockbackAmount = swingingWeapon.getKnockback();

    // Knockback on the windup or the swing
    if (knockbackAmount) {
      this.stun(clamp((knockbackAmount / 175) * rNormal(1, 0.2), 0, 1));
      this.knockback(
        this.getPosition().sub(position).inormalize().imul(knockbackAmount),
      );
    }

    if (damageAmount) {
      this.hp -= swingingWeapon.weapon.stats.damage;
      this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.6, 0.1));

      const sounds = swingingWeapon.weapon.stats.sounds.hitFlesh;
      if (sounds) {
        const soundName = choose(...sounds);
        this.game?.addEntity(new PositionalSound(soundName, position));
      }

      this.makeBlood(position, damageAmount);
    }

    if (this.hp <= 0) {
      this.die(swingingWeapon.holder);
    } else {
      this.voice.speak("hit");
    }
  }

  makeBlood(position: V2d, damage: number, normal?: V2d) {
    this.game?.addEntity(new FleshImpact(position, damage / 10, normal));
  }

  stun(duration: number) {
    this.stunnedTimer = Math.max(this.stunnedTimer, duration);
    this.handleStun();
  }

  handleStun() {
    if (this.getAttackPhase() === "windup") {
      this.attackAction?.reset();
    }
  }

  die(killer?: Human) {
    this.game?.dispatch("zombieDied", { zombie: this, killer });
    this.handleDeath();
    this.destroy();
  }

  handleDeath() {
    this.game?.addEntity(new FleshImpact(this.getPosition(), 6));
    this.voice.speak("death", true);
  }
}

export function isEnemy(e: Entity): e is BaseEnemy {
  return e instanceof BaseEnemy;
}
