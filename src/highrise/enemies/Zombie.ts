import { Body, Circle } from "p2";
import fleshHit1 from "../../../resources/audio/impacts/flesh-hit-1.flac";
import fleshHit2 from "../../../resources/audio/impacts/flesh-hit-2.flac";
import fleshHit3 from "../../../resources/audio/impacts/flesh-hit-3.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { angleDelta, degToRad, polarToVec } from "../../core/util/MathUtil";
import { choose, rBool, rInteger, rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../constants";
import FleshImpact from "../effects/FleshImpact";
import Hittable from "../environment/Hittable";
import Human, { isHuman } from "../human/Human";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/SwingingWeapon";
import Crawler from "./Crawler";
import ZombieController from "./ZombieController";
import ZombieSprite from "./ZombieSprite";
import ZombieVoice from "./ZombieVoice";

const SPEED = 0.4;
const FRICTION = 0.1;
const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE = degToRad(90);
const ATTACK_DAMAGE = 10;
const WINDUP_TIME = 0.2; // Time in animation from beginning of attack to doing damage
const ATTACK_TIME = 0.1; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.1; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 0.5; // Time after windown before starting another attack
const CRAWLER_CHANCE = 0.2; // Chance to turn into a crawler on death

type AttackPhase = "ready" | "windup" | "attack" | "winddown" | "cooldown";
export default class Zombie extends BaseEntity implements Entity, Hittable {
  tags = ["zombie"];
  body: Body;
  hp: number = rInteger(75, 120);
  speed: number = rNormal(SPEED, SPEED / 5);
  stunnedTimer = 0;
  voice: ZombieVoice;
  attackPhase: AttackPhase = "ready";
  attackPhasePercent: number = 0;
  controller: ZombieController;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: ZOMBIE_RADIUS });
    shape.collisionGroup = CollisionGroups.Zombies;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);
    this.body.angularDamping = 0.9;

    this.controller = this.addChild(new ZombieController(this));
    this.addChild(new ZombieSprite(this));
    this.voice = this.addChild(new ZombieVoice(this));
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

  async attack() {
    if (this.attackPhase === "ready") {
      this.voice.speak("attack");

      this.attackPhase = "windup";
      this.attackPhasePercent = 0;
      await this.wait(
        WINDUP_TIME,
        (dt, t) => (this.attackPhasePercent = t),
        "windup"
      );

      this.attackPhase = "attack";
      this.attackPhasePercent = 0;
      await this.wait(
        ATTACK_TIME,
        (dt, t) => (this.attackPhasePercent = t),
        "attack"
      );
      for (const human of this.getHumansInRange()) {
        human.inflictDamage(ATTACK_DAMAGE);
      }

      this.attackPhase = "winddown";
      this.attackPhasePercent = 0;
      await this.wait(
        WINDDOWN_TIME,
        (dt, t) => (this.attackPhasePercent = t),
        "winddown"
      );

      this.attackPhase = "cooldown";
      this.attackPhasePercent = 0;
      await this.wait(
        COOLDOWN_TIME,
        (dt, t) => (this.attackPhasePercent = t),
        "cooldown"
      );

      this.attackPhase = "ready";
      this.attackPhasePercent = 0;
    }
  }

  getHumansInRange(): Human[] {
    const humans = [...(this.game?.entities.getByFilter(isHuman) ?? [])];
    return humans.filter((human) => {
      const displacement = human.getPosition().sub(this.body.position);
      const inRange = displacement.magnitude < ATTACK_RANGE;
      const diffAngle = angleDelta(displacement.angle, this.body.angle);
      const inAngle = Math.abs(diffAngle) < ATTACK_ANGLE;
      return inRange && inAngle;
    });
  }

  canWalk(): boolean {
    return (
      !this.isStunned &&
      this.attackPhase !== "windup" &&
      this.attackPhase !== "attack" &&
      this.attackPhase !== "winddown"
    );
  }

  walk(direction: V2d) {
    if (this.canWalk()) {
      this.body.applyImpulse(direction.mul(this.speed));
    }
  }

  setDirection(angle: number) {
    this.body.angle = angle;
  }

  stun(duration: number) {
    this.stunnedTimer = Math.max(this.stunnedTimer, duration);
    if (this.attackPhase === "windup") {
      this.clearTimers("windup");
      this.attackPhase = "ready";
    }
  }

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    this.game?.addEntities([
      new PositionalSound(choose(fleshHit1, fleshHit2, fleshHit3), position),
      new FleshImpact(position, bullet.damage / 10, normal),
    ]);

    this.voice.speak("hit");

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

  die(killer?: Human) {
    this.game?.dispatch({ type: "zombieDied", zombie: this, killer });
    this.game?.addEntity(new FleshImpact(this.getPosition(), 6));
    this.voice.speak("death");

    if (rBool(CRAWLER_CHANCE)) {
      this.game?.addEntity(new Crawler(this.getPosition(), this.body.angle));
    }

    this.destroy();
  }
}
