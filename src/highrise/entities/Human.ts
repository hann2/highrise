import { Body, Circle } from "p2";
import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp, normalizeAngle, radToDeg } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Character, CharacterSoundClass } from "../characters/Character";
import { randomCharacter } from "../characters/characters";
import { CollisionGroups } from "../Collision";
import { testLineOfSight } from "../utils/visionUtils";
import Bullet from "./Bullet";
import GunPickup from "./GunPickup";
import Gun from "./guns/Gun";
import Hittable from "./Hittable";
import Interactable, { isInteractable } from "./Interactable";

export const HUMAN_RADIUS = 0.5; // meters
const SPEED = 4; // arbitrary units
const FRICTION = 0.4; // arbitrary units
const INTERACT_DISTANCE = 3; // meters
const MAX_HEALTH = 100;

export default class Human extends BaseEntity implements Entity, Hittable {
  body: Body;
  sprite: Sprite;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  gun?: Gun;

  constructor(
    position: V2d = V(0, 0),
    public character: Character = randomCharacter()
  ) {
    super();

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.sprite = Sprite.from(character.image);
    this.sprite.anchor.set(0.5, 0.5); // make it rotate about the middle
    this.sprite.scale.set((2 * HUMAN_RADIUS) / this.sprite.width);
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = radToDeg(this.body.angle);

    const healthPercent = clamp(this.hp / 100);
    this.sprite.tint = colorLerp(0xff0000, 0xffffff, healthPercent);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  // Have the human face a specific angle
  setDirection(angle: number) {
    this.body.angle = normalizeAngle(angle);
  }

  setPosition(position: V2d) {
    this.body.position = position;
  }

  getDirection(): number {
    return this.body.angle;
  }

  pullTrigger() {
    this.gun?.pullTrigger(this);
  }

  async giveGun(gun: Gun) {
    if (this.gun) {
      this.dropGun();
    }
    this.gun = gun;
    this.addChild(gun, true);

    gun.playSound("pickup", this.getPosition());
    await this.wait(0.5);
    this.speak("pickupItem");
  }

  dropGun() {
    if (this.gun) {
      this.game?.addEntity(new GunPickup(this.getPosition(), this.gun));
      this.gun = undefined;
    }
  }

  // Return a list of all interactables within range
  getNearbyInteractables(): Interactable[] {
    return this.game!.entities.getByFilter(isInteractable)
      .filter((i) => testLineOfSight(i, this))
      .filter(
        (i) =>
          i.getPosition().sub(this.getPosition()).magnitude < INTERACT_DISTANCE
      )
      .sort(
        (i1, i2) =>
          i1.getPosition().sub(this.getPosition()).magnitude -
          i2.getPosition().sub(this.getPosition()).magnitude
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

  onBulletHit(bullet: Bullet, position: V2d) {
    this.hp -= bullet.damage;

    this.game!.addEntity(new PositionalSound(choose("fleshHit1"), position));

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  // Inflict damage on the human
  inflictDamage(amount: number) {
    this.hp -= amount;

    this.speak("hurt");

    if (this.hp <= 0) {
      this.speak("death");
      this.game?.dispatch({ type: "humanDied", human: this });
      this.destroy();
    }
  }

  heal(amount: number) {
    this.hp += amount;
    if (this.hp > MAX_HEALTH) {
      this.hp = MAX_HEALTH;
    }
  }

  speak(soundClass: CharacterSoundClass) {
    // TODO: Only speak one sound at a time
    const sounds = this.character.sounds[soundClass];
    if (sounds.length > 0) {
      const sound = choose(...sounds);
      this.game?.addEntity(new PositionalSound(sound, this.getPosition()));
    }
  }
}
