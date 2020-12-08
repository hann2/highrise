import { Body, Circle } from "p2";
import fleshHit1 from "../../../../resources/audio/impacts/flesh-hit-1.flac";
import fleshHit2 from "../../../../resources/audio/impacts/flesh-hit-2.flac";
import fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { angleDelta, degToRad, polarToVec } from "../../../core/util/MathUtil";
import { choose, rNormal } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import BloodSplat from "../../effects/BloodSplat";
import { CollisionGroups } from "../../physics/CollisionGroups";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import Bullet from "../Bullet";
import Hittable from "../Hittable";
import Human, { HUMAN_RADIUS } from "../human/Human";
import ZombieController from "./ZombieController";
import ZombieSprite from "./ZombieSprite";
import ZombieVoice from "./ZombieVoice";

export const ZOMBIE_RADIUS = 0.35; // meters
const SPEED = 0.4;
const FRICTION = 0.1;
const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE = degToRad(90);
const ATTACK_DAMAGE = 20;
const WINDUP_TIME = 0.2; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.1; // Time in animation from doing damage to end of attack

export default class Zombie extends BaseEntity implements Entity, Hittable {
  tags = ["zombie"];
  body: Body;
  hp: number = 100;
  speed: number = rNormal(SPEED, SPEED / 5);
  stunnedTimer = 0;
  voice: ZombieVoice;
  attackPhase: "ready" | "windup" | "attack" | "winddown" = "ready";

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: ZOMBIE_RADIUS });
    shape.collisionGroup = CollisionGroups.Zombies;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);
    this.body.angularDamping = 0.9;

    this.addChild(new ZombieController(this));
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
      this.attackPhase = "windup";
      await this.wait(WINDUP_TIME, undefined, "windup");
      this.attackPhase = "attack";
      for (const human of this.getHumansInRange()) {
        human.inflictDamage(ATTACK_DAMAGE);
      }
      this.attackPhase = "winddown";
      await this.wait(WINDDOWN_TIME, undefined, "winddown");
      this.attackPhase = "ready";
    }
  }

  getHumansInRange(): Human[] {
    const humans = this.game?.entities.getTagged("human") as Human[];
    return humans.filter((human) => {
      const displacement = human.getPosition().isub(this.body.position);
      const inRange = displacement.magnitude < ATTACK_RANGE;
      const diffAngle = angleDelta(displacement.angle, this.body.angle);
      const inAngle = Math.abs(diffAngle) < ATTACK_ANGLE;
      return inRange && inAngle;
    });
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(this.speed));
  }

  setDirection(angle: number) {
    this.body.angle = angle;
  }

  stun(duration: number) {
    this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.3, 0.05));
    this.clearTimers("windup");
  }

  onBulletHit(bullet: Bullet, position: V2d) {
    this.hp -= bullet.damage;

    this.game?.addEntity(
      new PositionalSound(choose(fleshHit1, fleshHit2, fleshHit3), position)
    );

    this.voice.speak("hit");

    if (this.hp <= 0) {
      this.die();
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

      // TODO: Get sound from weapon
      const sounds = swingingWeapon.weapon.stats.sounds.hitFlesh;
      if (sounds) {
        const soundName = choose(...sounds);
        this.game?.addEntity(new PositionalSound(soundName, position));
      }

      this.voice.speak("hit");
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.game?.dispatch({ type: "zombieDied", zombie: this });
    this.game?.addEntity(new BloodSplat(this.getPosition()));
    this.destroy();
  }
}
