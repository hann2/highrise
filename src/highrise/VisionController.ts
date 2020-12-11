import { Sprite } from "pixi.js";
import solidCircle from "../../resources/images/solid-circle.png";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { V } from "../core/Vector";
import { getPartyLeader } from "./entities/PartyManager";
import { Layers } from "./layers";
import { Shadows } from "./lighting/Shadows";

export default class VisionController extends BaseEntity implements Entity {
  persistent = true;

  shadows: Shadows;
  sprite: Sprite & GameSprite;

  constructor() {
    super();

    this.shadows = this.addChild(new Shadows(V(0, 0), 10));

    this.sprite = new Sprite();
    this.sprite.addChild(this.shadows.graphics);
    this.sprite.layerName = Layers.VISION;
  }

  onAdd() {
    console.log("new vision controller");
  }

  onRender() {
    const leader = getPartyLeader(this.game!);
    if (leader) {
      const position = leader.getPosition();
      this.sprite.position.set(...position);
      this.shadows.setPosition(position);
      this.shadows.forceUpdate();
    }
  }
}
