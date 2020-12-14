import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import img_visionFog from "../../resources/images/lights/vision-fog.png";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { V } from "../core/Vector";
import { getPartyLeader } from "./entities/PartyManager";
import { Layers } from "./layers";
import { Shadows } from "./lighting/Shadows";

export const MAX_VISION = 10; // meters
export default class VisionController extends BaseEntity implements Entity {
  persistent = true;

  shadows: Shadows;
  sprite: Sprite & GameSprite;

  constructor() {
    super();

    this.shadows = this.addChild(new Shadows(V(0, 0), MAX_VISION));

    const fog = Sprite.from(img_visionFog);
    fog.blendMode = BLEND_MODES.MULTIPLY;
    fog.width = MAX_VISION * 2;
    fog.height = MAX_VISION * 2;
    fog.anchor.set(0.5);

    const distanceShadows = new Graphics();
    distanceShadows
      .beginFill(0x000000)
      .drawRect(-100, -100, 200, 200)
      .beginHole()
      .drawRect(-MAX_VISION, -MAX_VISION, 2 * MAX_VISION, 2 * MAX_VISION)
      .endHole()
      .endFill();

    this.sprite = new Sprite();
    this.sprite.addChild(this.shadows.graphics);
    this.sprite.addChild(fog);
    this.sprite.addChild(distanceShadows);
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
