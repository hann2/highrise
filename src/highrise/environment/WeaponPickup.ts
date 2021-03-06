import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { GameSprite } from "../../core/entity/Entity";
import { rSign, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import Interactable from "./Interactable";

export default class WeaponPickup extends BaseEntity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d, public weapon: Gun | MeleeWeapon) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    this.sprite = Sprite.from(weapon.stats.textures.pickup);
    this.sprite.scale.set(weapon.stats.size[1] / this.sprite.height);
    this.sprite.scale.x *= rSign(); // Flip some of them
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.rotation = rUniform(0, Math.PI * 2);
    this.sprite.layerName = Layer.ITEMS;
  }

  onInteract(human: Human) {
    human.giveWeapon(this.weapon);
    this.destroy();
  }
}
