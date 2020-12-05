import { Body, Circle, vec2 } from "p2";
import { Sprite } from "pixi.js";
import zoimbie1Hold from "../../../resources/images/Zombie 1/zoimbie1_hold.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundName } from "../../core/resources/sounds";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp, polarToVec } from "../../core/util/MathUtil";
import { choose, rBool, rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { testLineOfSight } from "../utils/visionUtils";
import Bullet from "./Bullet";
import Hittable from "./Hittable";
import Human, { HUMAN_RADIUS } from "./human/Human";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";

const RADIUS = 0.3; // meters
const SPEED = 0.4;
const FRICTION = 0.1;
const ZOMBIE_ATTACK_RANGE = RADIUS + HUMAN_RADIUS + 0.1;
const ZOMBIE_ATTACK_DAMAGE = 20;
const ZOMBIE_ATTACK_COOLDOWN = 1.2;
const ZOMBIE_ATTACK_WINDUP = 0.2; // Time in animation from beginning of attack to doing damage
const ZOMBIE_ATTACK_WINDDOWN = 0.1; // Time in animation from doing damage to end of attack
const ZOMBIE_ATTACK_ANIMATION_LENGTH =
  ZOMBIE_ATTACK_WINDUP + ZOMBIE_ATTACK_WINDDOWN;

export default class Zombie extends BaseEntity implements Entity, Hittable {
  body: Body;
  sprite: Sprite;
  hp: number = 100;
  positionOfLastTarget?: V2d;
  tags = ["zombie"];
  attackCooldown = 0;
  attackProgress: number | null = null;
  speed: number = rNormal(SPEED, SPEED / 5);
  stunnedTimer = 0;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: RADIUS });
    shape.collisionGroup = CollisionGroups.Zombies;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);
    this.body.angularDamping = 0.9;

    this.sprite = Sprite.from(zoimbie1Hold);
    this.sprite.anchor.set(0.5, 0.5); // make it rotate about the middle
    this.sprite.scale.set((2 * RADIUS) / this.sprite.width);
  }

  onTick(dt: number) {
    if (this.stunnedTimer > 0) {
      this.stunnedTimer -= dt;
    } else {
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
      }
      if (this.attackProgress !== null) {
        if (this.attackProgress >= ZOMBIE_ATTACK_ANIMATION_LENGTH) {
          this.attackProgress = null;
        } else {
          this.attackProgress += dt;
        }
      }

      const [
        nearestVisibleHuman,
        nearestDistance,
      ] = this.getNearestVisibleHuman();

      if (nearestVisibleHuman || this.positionOfLastTarget) {
        const targetPosition = nearestVisibleHuman
          ? nearestVisibleHuman.getPosition()
          : this.positionOfLastTarget;
        this.positionOfLastTarget = targetPosition;
        const direction = targetPosition!.sub(this.getPosition()).inormalize();
        this.walk(direction);
        this.face(direction.angle);
      }

      if (
        nearestVisibleHuman &&
        nearestDistance < ZOMBIE_ATTACK_RANGE &&
        this.attackCooldown <= 0
      ) {
        this.wait(ZOMBIE_ATTACK_WINDUP, undefined, "zombieDamage").then(() => {
          const [
            nearestVisibleHuman,
            nearestDistance,
          ] = this.getNearestVisibleHuman();
          if (nearestVisibleHuman && nearestDistance < ZOMBIE_ATTACK_RANGE) {
            nearestVisibleHuman.inflictDamage(ZOMBIE_ATTACK_DAMAGE);
          }
        });

        this.attackProgress = 0;
        this.attackCooldown = ZOMBIE_ATTACK_COOLDOWN;
      }
    }

    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  getNearestVisibleHuman(
    maxDistance: number = 15
  ): [Human | undefined, number] {
    const humans = this.game!.entities.getTagged("human") as Human[];

    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = maxDistance;

    for (const human of humans) {
      // should you be able to sneak up on zombie???
      const distance = vec2.dist(human.body.position, this.body.position);
      if (distance < nearestDistance) {
        const isVisible = testLineOfSight(this, human);
        if (isVisible) {
          nearestDistance = distance;
          nearestVisibleHuman = human;
        }
      }
    }

    return [nearestVisibleHuman, nearestDistance];
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.rotation = this.body.angle;

    if (this.attackProgress != null) {
      if (this.attackProgress < ZOMBIE_ATTACK_WINDUP) {
        const attackPercent = clamp(this.attackProgress / ZOMBIE_ATTACK_WINDUP);
        this.sprite.tint = colorLerp(0xffffff, 0x666666, attackPercent);
      } else {
        const attackPercent = clamp(
          (this.attackProgress - ZOMBIE_ATTACK_WINDUP) / ZOMBIE_ATTACK_WINDDOWN
        );
        this.sprite.tint = colorLerp(0x666666, 0xffffff, attackPercent);
      }
    }
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(this.speed));
  }

  face(angle: number) {
    this.body.angle = angle;
  }

  onBulletHit(bullet: Bullet, position: V2d) {
    this.hp -= bullet.damage;

    this.game?.addEntity(new PositionalSound(choose("fleshHit1"), position));

    this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.3, 0.05));

    this.game?.addEntity(
      new PositionalSound(
        choose("zombieHit1", "zombieHit2"),
        this.getPosition()
      )
    );

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  interruptAttack() {
    if (this.attackProgress != null) {
      this.attackProgress = null;
      this.clearTimers("zombieDamage");
    }
  }

  knockback(direction: number, amount: number = 50) {
    this.body.applyImpulse(polarToVec(direction, amount));
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d) {
    const damageAmount = swingingWeapon.getDamage();
    const knockbackAmount = swingingWeapon.getKnockback();

    // Knockback on the windup or the swing
    if (knockbackAmount) {
      this.interruptAttack();
      this.knockback(this.getPosition().sub(position).angle, knockbackAmount);
    }

    if (damageAmount) {
      this.hp -= swingingWeapon.weapon.stats.damage;
      this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.6, 0.1));
      this.game?.addEntity(new PositionalSound(choose("fleshHit1"), position));
      this.speak(choose("zombieHit1", "zombieHit2"));
    }

    if (this.hp <= 0) {
      this.game?.dispatch({ type: "zombieDied", zombie: this });
      this.destroy();
    }
  }

  speak(soundName: SoundName) {
    this.game?.addEntity(new PositionalSound(soundName, this.getPosition()));
  }
}
