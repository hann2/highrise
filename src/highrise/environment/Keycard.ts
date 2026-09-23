import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { rDirection } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";
import Interactable from "./Interactable";

const WIDTH = 0.34;
const HEIGHT = 0.22;

/** Opens one locked room. There's one per floor. */
export default class Keycard extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(position: V2d) {
    super();

    this.addChild(new Interactable(position, this.handleInteract.bind(this)));

    this.sprite = new Graphics()
      .roundRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 0.03)
      .fill(0xeeeeee)
      // magnetic stripe
      .rect(-WIDTH / 2, -HEIGHT / 2 + 0.04, WIDTH, 0.05)
      .fill(0x2255cc)
      // chip
      .rect(WIDTH / 2 - 0.12, 0.01, 0.07, 0.05)
      .fill(0xddaa33);
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rDirection();
    this.sprite.layerName = Layer.ITEMS;
  }

  handleInteract(human: Human) {
    human.keycards += 1;
    this.game.addEntity(
      new PositionalSound("magazineLoad1", human.getPosition()),
    );
    this.destroy();
  }
}
