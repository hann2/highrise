import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { rDirection } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import Human from "../human/Human";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import { drawConsumable } from "../weapons/consumables/ThrownConsumable";
import Interactable from "./Interactable";

/** Grenades (or other consumables) lying on the floor. Interact to take them. */
export default class ConsumablePickup extends BaseEntity implements Entity {
  sprite: Container & GameSprite;

  constructor(
    private position: V2d,
    public stats: ConsumableStats,
    public count: number = 1,
  ) {
    super();

    const interactable = this.addChild(
      new Interactable(position, this.handleInteract.bind(this)),
    );
    // Swapping types is always possible; topping up only while there's room
    interactable.canInteract = (human) =>
      (human.consumable && human.consumable !== stats) ||
      human.consumableCount < stats.maxCarry;
    interactable.prompt = (human) => ({
      title: count > 1 ? `${stats.name} ×${count}` : stats.name,
      detail:
        human.consumable && human.consumable !== stats
          ? `replaces ${human.consumable.name}`
          : undefined,
    });

    // One drawn per item, side by side
    this.sprite = new Container();
    this.sprite.layerName = Layer.ITEMS;
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rDirection();
    const spacing = stats.size[1] * 1.3;
    for (let i = 0; i < count; i++) {
      const item = drawConsumable(stats);
      item.rotation = Math.PI / 2;
      item.position.copyFrom(V((i - (count - 1) / 2) * spacing, 0));
      this.sprite.addChild(item);
    }

    // A faint glow so it catches the eye in a dark room
    const glint = new Graphics()
      .circle(0, 0, 0.25)
      .fill({ color: 0xffffff, alpha: 0.08 });
    glint.blendMode = "add";
    this.sprite.addChildAt(glint, 0);
  }

  getPosition() {
    return this.position;
  }

  handleInteract(human: Human) {
    if (this.isDestroyed) {
      return;
    }
    // Swapping types drops what the human was carrying, as a new pickup
    const taken = human.giveConsumable(this.stats, this.count);
    if (taken <= 0) {
      return; // Can't carry any more
    }
    this.game.addEntity(
      new PositionalSound("glowStickDrop1", this.position, { speed: 0.6 }),
    );
    if (taken >= this.count) {
      this.destroy();
    } else {
      this.game.addEntity(
        new ConsumablePickup(this.position, this.stats, this.count - taken),
      );
      this.destroy();
    }
  }
}
