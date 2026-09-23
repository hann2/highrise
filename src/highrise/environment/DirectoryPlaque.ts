import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V2d } from "../../core/Vector";
import LevelController from "../controllers/LevelController";
import Human from "../human/Human";
import FloorDirectory, { isFloorDirectoryOpen } from "../menu/FloorDirectory";
import Interactable from "./Interactable";

// Meters
const WIDTH = 0.9;
const HEIGHT = 0.3;
const FRAME = 0.04;
const PLAQUE_COLOR = 0x151515;
const FRAME_COLOR = 0xc9a45c;
const LINE_COLOR = 0x8a8a8a;

/**
 * A small building directory on a wall of the spawn room. Reading it (E)
 * shows the floors of the run and which one this is.
 */
export default class DirectoryPlaque extends BaseEntity implements Entity {
  tags = ["directory_plaque"];
  sprite: Graphics & GameSprite;

  constructor(
    readonly position: V2d,
    angle: number,
  ) {
    super();

    this.sprite = drawPlaque();
    this.sprite.layerName = Layer.ITEMS;
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = angle;

    const interactable = this.addChild(
      new Interactable(position, (human) => this.handleInteract(human), 2),
    );
    interactable.highlightRadius = 0.55;
    interactable.prompt = () => ({ title: "Directory", action: "to read" });
  }

  handleInteract(_human: Human) {
    if (isFloorDirectoryOpen(this.game)) {
      return;
    }
    const levelController = this.game.entities.getSingleton(LevelController);
    this.game.addEntity(
      new PositionalSound("quarterDrop1", this.position, { speed: 1.4 }),
    );
    this.game.addEntity(
      new FloorDirectory(levelController.plan, levelController.currentLevel),
    );
  }
}

/** A dark plaque with a brass frame and a few lines of writing, seen from above */
function drawPlaque(): Graphics & GameSprite {
  const graphics = new Graphics();
  graphics
    .rect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT)
    .fill(FRAME_COLOR)
    .rect(
      -WIDTH / 2 + FRAME,
      -HEIGHT / 2 + FRAME,
      WIDTH - 2 * FRAME,
      HEIGHT - 2 * FRAME,
    )
    .fill(PLAQUE_COLOR);
  // Rows of writing
  for (let i = 0; i < 3; i++) {
    const y = -HEIGHT / 2 + FRAME * 2.5 + i * 0.07;
    graphics
      .rect(-WIDTH / 2 + FRAME * 3, y, WIDTH * (0.45 + 0.15 * (i % 2)), 0.025)
      .fill(LINE_COLOR);
  }
  return graphics;
}
