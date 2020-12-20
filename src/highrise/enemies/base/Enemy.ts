import { Body } from "p2";
import snd_fleshHit1 from "../../../../resources/audio/impacts/flesh-hit-1.flac";
import snd_fleshHit2 from "../../../../resources/audio/impacts/flesh-hit-2.flac";
import snd_fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import type Entity from "../../../core/entity/Entity";
import type { WithOwner } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { normalizeAngle, polarToVec } from "../../../core/util/MathUtil";
import { choose, rNormal } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { RACHEL_ZOMBIE_SOUNDS } from "../../constants";
import {
  AttackPhases,
  createAttackAction,
} from "../../creature-stuff/AttackAction";
import { Creature } from "../../creature-stuff/Creature";
import { PhasedAction } from "../../utils/PhasedAction";
import FleshImpact from "../../effects/FleshImpact";
import Human from "../../human/Human";
import Bullet from "../../projectiles/Bullet";
import AimSpring from "../../utils/AimSpring";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import { makeSimpleEnemyBody } from "./enemyUtils";
import EnemyVoice from "./EnemyVoice";

const FRICTION = 0.1; // Walking friction

export class BaseEnemy extends Creature {
  hp: number = 100;
  aimSpring!: AimSpring;
  body: Body & WithOwner;
  stunnedTimer: number = 0;
  voice: EnemyVoice;
  attackAction?: PhasedAction<AttackPhases, any>;
  walkSpeed: number = 0.4;

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

  getWalkSpeed() {
    return this.walkSpeed;
  }

  walk(direction: V2d) {
    if (this.canWalk()) {
      this.body.applyImpulse(direction.mul(this.getWalkSpeed()));
    }
  }

  constructor(position: V2d) {
    super();

    this.body = this.makeBody(position);
    this.voice = this.makeVoice();
    this.attackAction = this.makeAttackAction();
  }

  makeBody(position: V2d): Body {
    return makeSimpleEnemyBody(position, 0.3);
  }

  makeVoice() {
    return new EnemyVoice(() => this.getPosition(), RACHEL_ZOMBIE_SOUNDS);
  }

  makeAttackAction(): PhasedAction<AttackPhases, any> | undefined {
    return this.addChild(
      createAttackAction({
        windupDuration: 0.2,
        attackDuration: 0.1,
        windDownDuration: 0.1,
        cooldownDuration: 0.5,
        onWindupStart: () => {
          this.voice.speak("attack");
        },
        onAttack: () => {},
      })
    );
  }

  async attack() {
    if (this.attackAction && !this.attackAction.isActive()) {
      await this.attackAction!.do();
    }
  }

  onAdd(game: Game) {
    this.aimSpring = new AimSpring(game.ground, this.body);
    this.springs = [this.aimSpring];
  }

  onTick(dt: number) {
    if (this.stunnedTimer > 0) {
      this.stunnedTimer -= dt;
    }

    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    const impulse = bullet.velocity.mul(bullet.mass * 3);
    const relativePos = position.sub(this.body.position);
    this.body.applyImpulse(impulse, relativePos);

    this.game?.addEntities([
      new PositionalSound(
        choose(snd_fleshHit1, snd_fleshHit2, snd_fleshHit3),
        position
      ),
      new FleshImpact(position, bullet.damage / 10, normal),
    ]);

    if (this.hp <= 0) {
      this.die(bullet.shooter);
    }
  }

  knockback(direction: number, amount: number = 1) {
    this.body.applyImpulse(polarToVec(direction, amount * 0.1));
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d) {
    const damageAmount = swingingWeapon.getDamage();
    const knockbackAmount = swingingWeapon.getKnockback();

    // Knockback on the windup or the swing
    if (knockbackAmount) {
      this.stun((knockbackAmount / 25) * rNormal(1, 0.2));
      this.knockback(this.getPosition().sub(position).angle, knockbackAmount);
    }

    if (damageAmount) {
      this.hp -= swingingWeapon.weapon.stats.damage;
      this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.6, 0.1));

      const sounds = swingingWeapon.weapon.stats.sounds.hitFlesh;
      if (sounds) {
        const soundName = choose(...sounds);
        this.game?.addEntity(new PositionalSound(soundName, position));
      }

      this.voice.speak("hit");
    }

    if (this.hp <= 0) {
      this.die(swingingWeapon.holder);
    }
  }

  stun(duration: number) {
    this.stunnedTimer = Math.max(this.stunnedTimer, duration);
    this.onStun();
  }

  onStun() {
    if (this.getAttackPhase() === "windup") {
      this.attackAction?.reset();
    }
  }

  die(killer?: Human) {
    this.game?.dispatch({ type: "zombieDied", zombie: this, killer });
    this.onDie();
    this.destroy();
  }

  onDie() {
    this.game?.addEntity(new FleshImpact(this.getPosition(), 6));
    this.voice.speak("death");
  }
}

export function isEnemy(e: Entity): e is BaseEnemy {
  return e instanceof BaseEnemy;
}