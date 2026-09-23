import { Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import { GameSprite } from "../../core/entity/GameSprite";
import { rDirection, rSign } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { slotFor } from "../weapons/weapons";
import Interactable from "./Interactable";

export default class WeaponPickup extends BaseEntity {
  sprite: Sprite & GameSprite;
  interactable: Interactable;

  constructor(
    position: V2d,
    public weapon: Gun | MeleeWeapon,
  ) {
    super();

    this.addChild(weapon, true); // Take ownership of the gun. This is a little weird
    this.interactable = this.addChild(
      new Interactable(position, this.handleInteract.bind(this)),
    );
    this.interactable.prompt = (human) => {
      const replaced = human.getWeaponInSlot(slotFor(weapon));
      return {
        title: weapon.stats.name,
        detail: replaced && `replaces ${replaced.stats.name}`,
      };
    };

    this.sprite = Sprite.from(weapon.stats.textures.pickup);
    this.sprite.scale.set(weapon.stats.size[1] / this.sprite.height);
    this.sprite.scale.x *= rSign(); // Flip some of them
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rDirection();
    this.sprite.layerName = Layer.ITEMS;
  }

  handleInteract(human: Human) {
    human.giveWeapon(this.weapon);
    this.destroy();
  }
}
