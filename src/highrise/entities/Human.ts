import { Body, Circle } from "p2";
import { Sprite } from "pixi.js";
import manBlueGun from "../../../resources/images/Man Blue/manBlue_gun.png";
import manBrownGun from "../../../resources/images/Man Brown/manBrown_gun.png";
import manOldGun from "../../../resources/images/Man Old/manOld_gun.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { normalizeAngle, radToDeg } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { testLineOfSight } from "../utils/visionUtils";
import Damageable from "./Damageable";
import Gun from "./guns/Gun";
import Interactable, { isInteractable } from "./Interactable";
import GunPickup from "./GunPickup";
import { Layers } from "../layers";

export const HUMAN_RADIUS = 0.5; // meters
const SPEED = 4; // arbitrary units
const FRICTION = 0.4; // arbitrary units
const INTERACT_DISTANCE = 3; // meters

export default class Human extends BaseEntity implements Entity, Damageable {
  body: Body;
  sprite: Sprite;
  tags = ["human"];
  hp: number = 100;
  gun?: Gun;

  constructor(position: V2d) {
    super();

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.sprite = Sprite.from(choose(manBlueGun, manBrownGun, manOldGun));
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

  giveGun(gun: Gun) {
    if (this.gun) {
      this.dropGun();
    }
    this.gun = gun;
    this.addChild(gun, true);
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

  // Inflict damage on the human
  damage(amount: number) {
    this.hp -= amount;
  }
}
