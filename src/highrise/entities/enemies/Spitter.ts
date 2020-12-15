import { Body, Circle } from "p2";
import fleshHit1 from "../../../../resources/audio/impacts/flesh-hit-1.flac";
import fleshHit2 from "../../../../resources/audio/impacts/flesh-hit-2.flac";
import fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS } from "../../constants";
import GooImpact from "../../effects/GooImpact";
import { CollisionGroups } from "../../physics/CollisionGroups";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import Bullet from "../Bullet";
import Hittable from "../Hittable";
import Human, { isHuman } from "../human/Human";
import Phlegm from "./Phlegm";
import SpitterController from "./SpitterController";
import SpitterSprite from "./SpitterSprite";
import ZombieVoice, { SPITTER_SOUNDS } from "./ZombieVoice";

const SPEED = 0.3;
const HEALTH = 100;

const FRICTION = 0.1;
export const SPITTER_ATTACK_RANGE = 10;
const WINDUP_TIME = 0.3; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.6; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 0.8; // Time after windown before starting another attack

const PHLEGM_SPEED = 8; // Meters / second
const DAMAGE = 20;

export default class Spitter extends BaseEntity implements Entity, Hittable {
  tags = ["zombie"];
  body: Body;
  hp: number = HEALTH;
  speed: number = rNormal(SPEED, SPEED / 5);
  stunnedTimer = 0;
  voice: ZombieVoice;
  attackPhase: "ready" | "windup" | "attack" | "winddown" | "cooldown" =
    "ready";

  constructor(position: V2d, angle: number = rUniform(0, Math.PI * 2)) {
    super();

    this.body = new Body({ mass: 1, position: position.clone(), angle });

    const shape = new Circle({ radius: ZOMBIE_RADIUS });
    shape.collisionGroup = CollisionGroups.Zombies;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);
    this.body.angularDamping = 0.9;

    this.addChild(new SpitterController(this));
    this.addChild(new SpitterSprite(this));
    this.voice = this.addChild(new ZombieVoice(this, SPITTER_SOUNDS));
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
      this.voice.speak("attack", true);
      this.attackPhase = "windup";
      await this.wait(WINDUP_TIME, undefined, "windup");
      this.attackPhase = "attack";
      this.game!.addEntity(
        new Phlegm(
          this.getPosition(),
          this.body.angle,
          PHLEGM_SPEED,
          DAMAGE,
          this
        )
      );
      this.attackPhase = "winddown";
      await this.wait(WINDDOWN_TIME, undefined, "winddown");
      this.attackPhase = "cooldown";
      await this.wait(COOLDOWN_TIME, undefined, "cooldown");
      this.attackPhase = "ready";
    }
  }

  getHumansInRange(): Human[] {
    const humans = [...this.game!.entities.getByFilter(isHuman)];
    return humans.filter((human) => {
      const displacement = human.getPosition().isub(this.body.position);
      const inRange = displacement.magnitude < SPITTER_ATTACK_RANGE;
      return inRange;
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
    this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.3, 0.05));
    this.clearTimers("windup");
  }

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.hp -= bullet.damage;

    this.game?.addEntities([
      new PositionalSound(choose(fleshHit1, fleshHit2, fleshHit3), position),
      new GooImpact(position, bullet.damage / 10, normal),
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
      this.stun(knockbackAmount / 50);
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
    this.game?.addEntity(new GooImpact(this.getPosition(), 5, undefined, 0.2));
    this.voice.speak("death");
    this.destroy();
  }
}
