import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import type { Item, Rarity } from "../items/Item";
import { canTake, giveItem } from "../items/items";
import Interactable from "./Interactable";

// Meters
const SIZE = 0.28;

/** The colors of the store's rarity tags, so a pickup reads the same */
const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xaaaaaa,
  uncommon: 0x6fb7ff,
  rare: 0xffc53d,
};

/**
 * An item lying in the world (in the armory, or dropped by a boss) rather
 * than for sale. Interact to take it, the same as buying it.
 */
export default class ItemPickup extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  interactable: Interactable;

  constructor(
    private position: V2d,
    readonly item: Item,
  ) {
    super();

    this.interactable = this.addChild(
      new Interactable(position, (human) => this.take(human)),
    );
    this.interactable.canInteract = (human) => canTake(human, item);
    this.interactable.prompt = () => ({
      title: item.name,
      detail: item.description,
    });

    // A little box with a band of its rarity's color, glowing faintly
    const color = RARITY_COLORS[item.rarity];
    this.sprite = new Container();
    this.sprite.layerName = Layer.ITEMS;
    this.sprite.position.copyFrom(position);
    const glint = new Graphics()
      .circle(0, 0, SIZE)
      .fill({ color, alpha: 0.15 });
    glint.blendMode = "add";
    const box = new Graphics()
      .roundRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 0.04)
      .fill(0x1c1c20)
      .stroke({ width: 0.02, color })
      .rect(-SIZE / 2, -SIZE * 0.08, SIZE, SIZE * 0.16)
      .fill(color);
    this.sprite.addChild(glint, box);
  }

  getPosition() {
    return this.position;
  }

  take(human: Human) {
    if (this.isDestroyed || !canTake(human, this.item)) {
      return;
    }
    giveItem(human, this.item);
    this.game.addEntity(
      new PositionalSound("quarterDrop1", this.position, { speed: 0.7 }),
    );
    this.destroy();
  }
}
