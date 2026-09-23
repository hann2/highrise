import { Container, Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import Door from "./Door";
import Interactable from "./Interactable";
import { getPartyManager } from "./PartyManager";

const LOCKED_DOOR_TINT = 0xff7777;
const LIGHT_COLOR = 0xff2200;

/**
 * Keeps a door locked until someone in the party uses a keycard on it.
 * Shows as a red light on the hallway side and a red tint on the door.
 */
export default class KeycardLock extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  interactable: Interactable;
  private glow: Graphics;

  constructor(
    public door: Door,
    /** Where to stand to use it, on the hallway side of the door */
    public outsidePosition: V2d,
  ) {
    super();

    door.setLocked(true);
    door.sprite.tint = LOCKED_DOOR_TINT;

    const doorway = door.getDoorwayCenter();
    this.interactable = this.addChild(
      new Interactable(doorway, this.handleInteract.bind(this), 1.8),
    );

    // A little red light on the hallway side, like a card reader
    this.sprite = new Container();
    this.sprite.layerName = Layer.EMISSIVES;
    this.sprite.position.copyFrom(doorway.lerp(outsidePosition, 0.2));

    this.glow = new Graphics()
      .circle(0, 0, 0.35)
      .fill({ color: LIGHT_COLOR, alpha: 0.3 })
      .circle(0, 0, 0.2)
      .fill({ color: LIGHT_COLOR, alpha: 0.4 });
    this.glow.blendMode = "add";
    this.sprite.addChild(this.glow);

    const bulb = new Graphics().circle(0, 0, 0.1).fill(LIGHT_COLOR);
    this.sprite.addChild(bulb);
  }

  @on("render")
  onRender() {
    // Slow pulse so it catches the eye
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.game.elapsedTime * 3);
  }

  handleInteract(human: Human) {
    const partyMembers = getPartyManager(this.game)?.partyMembers ?? [];
    const holder = [human, ...partyMembers].find((h) => h.keycards > 0);
    if (!holder) {
      this.game.addEntity(
        new PositionalSound("dryFire1", this.interactable.position),
      );
      return;
    }

    holder.keycards -= 1;
    this.door.setLocked(false);
    this.door.sprite.tint = 0xffffff;
    this.game.addEntity(
      new PositionalSound("heavySwitchThrow", this.interactable.position),
    );
    this.destroy();
  }
}
