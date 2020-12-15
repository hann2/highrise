import { Body, Circle } from "p2";
import fleshHit1 from "../../../../resources/audio/impacts/flesh-hit-1.flac";
import fleshHit2 from "../../../../resources/audio/impacts/flesh-hit-2.flac";
import fleshHit3 from "../../../../resources/audio/impacts/flesh-hit-3.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import {
  angleDelta,
  degToRad,
  normalizeAngle,
  polarToVec,
} from "../../../core/util/MathUtil";
import { choose, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants";
import FleshImpact from "../../effects/FleshImpact";
import { CollisionGroups } from "../../physics/CollisionGroups";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import Bullet from "../Bullet";
import Hittable from "../Hittable";
import Human from "../human/Human";
import Crawler from "./Crawler";
import DeathOrb from "./DeathOrb";
import NecromancerController from "./NecromancerController";
import NecromancerSprite from "./NecromancerSprite";
import Zombie from "./Zombie";
import ZombieVoice from "./ZombieVoice";

const SPEED = 0.1;
const HEALTH = 4000;

const FRICTION = 0.1;
const ATTACK_RANGE = ZOMBIE_RADIUS + HUMAN_RADIUS + 0.1;
const ATTACK_ANGLE = degToRad(90);
const ATTACK_DAMAGE = 20;
const WINDUP_TIME = 1; // Time in animation from beginning of attack to doing damage
const WINDDOWN_TIME = 0.2; // Time in animation from doing damage to end of attack
const COOLDOWN_TIME = 5; // Time after windown before starting another attack

export default class Necromancer
  extends BaseEntity
  implements Entity, Hittable {
  tags = ["zombie"];
  body: Body;
  hp: number = HEALTH;
  speed: number = rNormal(SPEED, SPEED / 5);
  stunnedTimer = 0;
  voice: ZombieVoice;
  attackPhase: "ready" | "windup" | "attack" | "winddown" | "cooldown" =
    "ready";

  constructor(
    position: V2d,
    public arenaUpperLeftCorner: V2d,
    public arenaDimensions: V2d
  ) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: ZOMBIE_RADIUS });
    shape.collisionGroup = CollisionGroups.Zombies;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);
    this.body.angularDamping = 0.9;

    this.addChild(new NecromancerController(this));
    this.addChild(new NecromancerSprite(this));
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

  async useAbility(ability: any) {
    if (this.attackPhase === "ready") {
      this.attackPhase = "windup";
      await this.wait(WINDUP_TIME, undefined, "windup");
      this.attackPhase = "attack";

      ability();

      this.attackPhase = "winddown";
      await this.wait(WINDDOWN_TIME, undefined, "winddown");
      this.attackPhase = "cooldown";
      await this.wait(COOLDOWN_TIME, undefined, "cooldown");
      this.attackPhase = "ready";
    }
  }

  async summonShield(direction: V2d = polarToVec(rUniform(0, 2 * Math.PI), 1)) {
    const nZombies = 5;
    const separation = Math.PI / 5;
    const angles: number[] = [];
    for (let i = 0; i < nZombies; i++) {
      angles.push(normalizeAngle(separation * (i - nZombies / 2)));
    }

    this.useAbility(() =>
      this.game!.addEntities(
        angles.map(
          (a) => new Zombie(this.getPosition().add(direction.rotate(a)))
        )
      )
    );
  }

  async attack(human: Human) {
    this.useAbility(() => {
      const direction = human.getPosition().sub(this.getPosition()).angle;
      this.body.angle = direction;
      this.body.angularVelocity = 0;
      this.addChild(new DeathOrb(this.getPosition(), direction));
    });
  }

  async surround(human: Human) {
    const angles: number[] = [];
    const nCrawlers = 7;
    const startingAngle = rUniform(0, Math.PI * 2);
    for (let i = 0; i < nCrawlers; i++) {
      angles.push(
        normalizeAngle(startingAngle + (i * Math.PI * 2) / nCrawlers)
      );
    }

    this.useAbility(() => {
      const p = human.getPosition();
      this.game!.addEntities(
        angles.map((a) => new Crawler(p.add(polarToVec(a, 2))))
      );
    });
  }

  getHumansInRange(): Human[] {
    const humans = (this.game?.entities.getTagged("human") as Human[]) ?? [];
    return humans.filter((human) => {
      const displacement = human.getPosition().isub(this.body.position);
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
    this.stunnedTimer = Math.max(this.stunnedTimer, rNormal(0.3, 0.05));
    this.clearTimers("windup");
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
    this.game?.addEntity(
      new FleshImpact(this.getPosition(), 5, undefined, 0.2)
    );
    this.voice.speak("death");
    this.destroy();
  }
}
