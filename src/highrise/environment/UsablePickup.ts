import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { rDirection } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import { drawUsable } from "../weapons/usables/usableImage";
import { UsableStats } from "../weapons/usables/UsableStats";
import Interactable from "./Interactable";

/** A health pack (or other usable) lying on the floor. Interact to take it. */
export default class UsablePickup extends BaseEntity implements Entity {
  sprite: Container & GameSprite;

  constructor(
    private position: V2d,
    public stats: UsableStats,
    public charges: number = stats.charges,
  ) {
    super();

    const interactable = this.addChild(
      new Interactable(position, this.handleInteract.bind(this)),
    );
    // Swapping kinds is always possible; topping up only while there's room
    interactable.canInteract = (human) =>
      !human.usable ||
      human.usable.stats !== stats ||
      human.usable.charges < stats.charges;
    interactable.prompt = (human) => ({
      title: stats.name,
      detail:
        human.usable && human.usable.stats !== stats
          ? `replaces ${human.usable.stats.name}`
          : `${charges} ${charges === 1 ? "use" : "uses"}`,
    });

    this.sprite = new Container();
    this.sprite.layerName = Layer.ITEMS;
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rDirection();
    // A faint glow so it catches the eye in a dark room
    const glint = new Graphics()
      .circle(0, 0, 0.25)
      .fill({ color: 0xffffff, alpha: 0.08 });
    glint.blendMode = "add";
    this.sprite.addChild(glint, drawUsable(stats));
  }

  getPosition() {
    return this.position;
  }

  handleInteract(human: Human) {
    if (this.isDestroyed || !human.giveUsable(this.stats, this.charges)) {
      return;
    }
    this.game.addEntity(
      new PositionalSound("glowStickDrop1", this.position, { speed: 0.8 }),
    );
    this.destroy();
  }
}
