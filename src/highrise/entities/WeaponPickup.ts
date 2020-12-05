import { Sprite, Text, Texture } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Gun from "./guns/Gun";
import Human from "./human/Human";
import Interactable from "./Interactable";
import MeleeWeapon from "./meleeWeapons/MeleeWeapon";
import { GameSprite } from "../../core/entity/Entity";
import { Layers } from "../layers";

export default class WeaponPickup extends BaseEntity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d, private weapon: Gun | MeleeWeapon) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.addChild(new Interactable(position, this.onInteract.bind(this)));

    const length = weapon.stats.size[1];
    const texture = weapon.stats.pickupTexture ?? Texture.WHITE;
    this.sprite = Sprite.from(texture);
    this.sprite.scale.set(length / this.sprite.height);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(...position);
    this.sprite.rotation = rUniform(0, Math.PI * 2);

    this.sprite.layerName = Layers.WORLD_BACK;
  }

  onInteract(human: Human) {
    human.giveWeapon(this.weapon);
    this.destroy();
  }
}
