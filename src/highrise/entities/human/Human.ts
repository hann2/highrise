import { Body, Circle } from "p2";
import snd_pop1 from "../../../../resources/audio/misc/pop1.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import {
  angleDelta,
  clamp,
  clampUp,
  degToRad,
  polarToVec,
} from "../../../core/util/MathUtil";
import { rNormal } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Character, randomCharacter } from "../../characters/Character";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants";
import FleshImpact from "../../effects/FleshImpact";
import GlowStick from "../../effects/GlowStick";
import { PointLight } from "../../lighting/PointLight";
import { CollisionGroups } from "../../physics/CollisionGroups";
import Gun from "../../weapons/Gun";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import Interactable, { isInteractable } from "../Interactable";
import WeaponPickup from "../WeaponPickup";
import Zombie from "../zombie/Zombie";
import Flashlight from "./Flashlight";
import HumanSprite from "./HumanSprite";
import HumanVoice from "./HumanVoice";

const MAX_ROTATION = 2 * Math.PI * 4; // Radians / second
const SPEED = 3.5; // arbitrary units
const HURT_SPEED = 3.0; // Speed while hurt
const FRICTION = 0.4; // arbitrary units
const MAX_HEALTH = 100;

export const PUSH_RANGE = 0.8; // meters
export const PUSH_ANGLE = degToRad(70);
export const PUSH_KNOCKBACK = 100; // newtons?
export const PUSH_STUN = 0.75; // seconds
export const PUSH_COOLDOWN = 0.4; // seconds

export const GLOWSTICK_COOLDOWN = 1.0; // seconds

export default class Human extends BaseEntity implements Entity {
  body: Body;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  light?: PointLight;
  humanSprite: HumanSprite;
  voice: HumanVoice;
  pushCooldown = 0;
  glowstickCooldown = 0;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter()
  ) {
    super();

    this.humanSprite = this.addChild(new HumanSprite(this));
    this.voice = this.addChild(new HumanVoice(this));

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionGroup = CollisionGroups.Humans;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Bullets;
    this.body.addShape(shape);

    this.addChild(new Flashlight(this));
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);

    this.pushCooldown = Math.max(this.pushCooldown - dt, 0);
    this.glowstickCooldown = Math.max(this.glowstickCooldown - dt, 0);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    let speed = SPEED;
    const healthPercent = this.hp / MAX_HEALTH;
    if (healthPercent < 0.3) {
      speed = HURT_SPEED;
    }
    this.body.applyImpulse(direction.mul(speed));
  }

  // Have the human face a specific angle
  setDirection(angle: number, dt: number = this.game!.tickTimestep) {
    const angleDiff = angleDelta(this.body.angle, angle);
    const turnAmount = clamp(angleDiff, -MAX_ROTATION * dt, MAX_ROTATION * dt);
    this.body.angle += turnAmount;
  }

  setPosition([x, y]: [number, number]) {
    this.body.position[0] = x;
    this.body.position[1] = y;
  }

  getDirection(): number {
    return this.body.angle;
  }

  useWeapon() {
    if (this.weapon instanceof Gun) {
      this.weapon.pullTrigger(this);
    } else if (this.weapon instanceof MeleeWeapon) {
      this.weapon.attack(this);
    }
  }

  reload() {
    if (this.weapon instanceof Gun) {
      this.weapon.reload(this);
    }
  }

  async giveWeapon(weapon: Gun | MeleeWeapon, shouldSpeak: boolean = true) {
    if (this.weapon) {
      this.dropWeapon();
    }
    this.weapon = weapon;
    this.addChild(weapon, true);
    this.game?.dispatch({ type: "giveWeapon", human: this, weapon });
    weapon.playSound("pickup", this.getPosition());
    this.humanSprite.onGiveWeapon(weapon);

    if (shouldSpeak) {
      await this.wait(0.5);
      this.voice.speak(weapon instanceof Gun ? "pickupGun" : "pickupMelee");
    }
  }

  dropWeapon() {
    if (this.weapon) {
      this.game?.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
      this.weapon = undefined;
      this.humanSprite.onDropWeapon();
    }
  }

  // Return a list of all interactables within range
  getNearbyInteractables(): Interactable[] {
    return (
      this.game!.entities.getByFilter(isInteractable)
        // .filter((i) => testLineOfSight(i, this))
        .filter(
          (i) =>
            i.getPosition().sub(this.body.position).magnitude < i.maxDistance
        )
        .sort(
          (i1, i2) =>
            i1.getPosition().sub(this.body.position).magnitude -
            i2.getPosition().sub(this.body.position).magnitude
        )
    );
  }

  // Interacts with the nearest interactable within range if there is one
  interactWithNearest(): Interactable | null {
    const interactables = this.getNearbyInteractables();
    if (interactables.length > 0) {
      interactables[0].interact(this);
      return interactables[0];
    } else {
      return null;
    }
  }

  // Inflict damage on the human
  inflictDamage(amount: number) {
    this.hp -= amount;

    this.game?.addEntity(new FleshImpact(this.getPosition(), 1));

    if (this.hp <= 0) {
      this.die();
    } else if (this.hp < 30) {
      this.voice.speak("nearDeath", true);
    } else {
      this.voice.speak("hurt");
    }
  }

  die() {
    this.voice.speak("death", true);
    this.game?.dispatch({ type: "humanDied", human: this });
    this.game?.addEntity(new FleshImpact(this.getPosition(), 6));

    if (this.weapon) {
      this.game?.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
    }
    this.destroy();
  }

  heal(amount: number) {
    this.voice.speak("pickupHealth");

    this.hp += amount;
    if (this.hp > MAX_HEALTH) {
      this.hp = MAX_HEALTH;
    }
  }

  push() {
    if (this.pushCooldown <= 0) {
      this.pushCooldown = PUSH_COOLDOWN;
      this.game?.addEntity(new PositionalSound(snd_pop1, this.getPosition()));
      for (const zombie of this.game!.entities.getTagged(
        "zombie"
      ) as Zombie[]) {
        const relPosition = zombie.getPosition().isub(this.getPosition());
        const distance = clampUp(
          relPosition.magnitude - HUMAN_RADIUS - ZOMBIE_RADIUS
        );
        const theta = Math.abs(angleDelta(relPosition.angle, this.body.angle));

        if (distance < PUSH_RANGE && theta < PUSH_ANGLE) {
          const amount =
            PUSH_KNOCKBACK - PUSH_KNOCKBACK * (distance / PUSH_RANGE);
          zombie.knockback(relPosition.angle, amount);
          zombie.stun(PUSH_STUN * rNormal(1, 0.2));
          zombie.voice.speak("hit");
        }
      }
    }
  }

  async throwGlowstick() {
    if (this.glowstickCooldown <= 0) {
      this.glowstickCooldown = GLOWSTICK_COOLDOWN;
      this.game?.addEntity(
        new GlowStick(
          this.getPosition(),
          polarToVec(this.getDirection(), rNormal(5, 1)).iadd(
            this.body.velocity
          )
        )
      );
    }
  }
}
