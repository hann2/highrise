import { Body, Circle } from "p2";
import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp, degToRad, normalizeAngle } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Character, CharacterSoundClass } from "../characters/Character";
import { randomCharacter } from "../characters/characters";
import { CollisionGroups } from "../Collision";
import { DirectionalLight } from "../lighting/DirectionalLight";
import { PointLight } from "../lighting/PointLight";
import Bullet from "./Bullet";
import Gun from "./guns/Gun";
import Hittable from "./Hittable";
import Interactable, { isInteractable } from "./Interactable";
import MeleeWeapon from "./meleeWeapons/MeleeWeapon";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";
import WeaponPickup from "./WeaponPickup";

export const HUMAN_RADIUS = 0.4; // meters
const SPEED = 4; // arbitrary units
const FRICTION = 0.4; // arbitrary units
const INTERACT_DISTANCE = 3; // meters
const MAX_HEALTH = 100;

export default class Human extends BaseEntity implements Entity, Hittable {
  body: Body;
  sprite: Sprite;
  tags = ["human"];
  hp: number = MAX_HEALTH;
  weapon?: Gun | MeleeWeapon;
  light: PointLight;
  // flashLight: DirectionalLight;

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
    shape.collisionGroup = CollisionGroups.Humans;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.sprite = new Sprite();
    const manSprite = Sprite.from(character.imageStand);
    manSprite.name = "man";
    manSprite.anchor.set(0.5, 0.5);
    manSprite.scale.set((2 * HUMAN_RADIUS) / manSprite.height);
    this.sprite.addChild(manSprite);
    this.sprite.anchor.set(0.5, 0.5);

    this.light = this.addChild(new PointLight(5, 0.4, 0xffffee, true));
    // this.flashLight = this.addChild(
    //   new DirectionalLight(15, degToRad(30), 0.6)
    // );
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);

    this.light.setPosition(this.body.position);
    // this.flashLight.setPosition(this.body.position);
    // this.flashLight.setDirection(this.body.angle);
  }

  // TODO: Guarantee that this happens after everyone else's render calls
  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.rotation = this.body.angle;

    const healthPercent = clamp(this.hp / 100);
    (this.sprite.getChildByName("man") as Sprite).tint = colorLerp(
      0xff0000,
      0xffffff,
      healthPercent
    );

    // Sorry Simon
    const weaponSprite = this.sprite.getChildByName("weapon");
    if (weaponSprite) {
      weaponSprite.visible =
        this.weapon instanceof Gun ||
        !this.weapon?.currentCooldown ||
        this.weapon?.currentCooldown <= 0;
    }
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
    this.body.position[0] = position[0];
    this.body.position[1] = position[1];
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

  async giveWeapon(weapon: Gun | MeleeWeapon) {
    if (this.weapon) {
      this.dropWeapon();
    }
    this.weapon = weapon;
    this.addChild(weapon, true);
    this.sprite.removeChildren();

    const manSprite =
      weapon instanceof Gun
        ? Sprite.from(this.character.imageGun)
        : Sprite.from(this.character.imageStand);
    manSprite.name = "man";
    manSprite.anchor.set(0.5, 0.5);
    manSprite.scale.set((2 * HUMAN_RADIUS) / manSprite.height);

    if (weapon instanceof MeleeWeapon && weapon.stats.pickupTexture) {
      const { size, handlePosition, pickupTexture } = weapon.stats;
      const { restAngle, restPosition } = weapon.swing;

      const weaponSprite = Sprite.from(pickupTexture);
      weaponSprite.scale.set(size[1] / weaponSprite.height);
      weaponSprite.anchor.set(...handlePosition);
      weaponSprite.rotation = Math.PI / 2 + restAngle;
      weaponSprite.position.set(...restPosition);
      weaponSprite.name = "weapon";
      this.sprite.addChild(weaponSprite);
    }

    this.sprite.addChild(manSprite);
    this.sprite.anchor.set(0.5, 0.5);

    weapon.playSound("pickup", this.getPosition());
    await this.wait(0.5);
    this.speak("pickupItem");
  }

  dropWeapon() {
    if (this.weapon) {
      this.game?.addEntity(new WeaponPickup(this.getPosition(), this.weapon));
      this.weapon = undefined;
    }
    this.sprite.removeChildren();
    const manSprite = Sprite.from(this.character.imageStand);
    manSprite.anchor.set(0.5, 0.5);
    manSprite.scale.set((2 * HUMAN_RADIUS) / manSprite.height);
    this.sprite.addChild(manSprite);
  }

  // Return a list of all interactables within range
  getNearbyInteractables(): Interactable[] {
    return (
      this.game!.entities.getByFilter(isInteractable)
        // .filter((i) => testLineOfSight(i, this))
        .filter(
          (i) =>
            i.getPosition().sub(this.getPosition()).magnitude <
            INTERACT_DISTANCE
        )
        .sort(
          (i1, i2) =>
            i1.getPosition().sub(this.getPosition()).magnitude -
            i2.getPosition().sub(this.getPosition()).magnitude
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
