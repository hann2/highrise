import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { KeyCode } from "../../core/io/Keys";
import { Graphics } from "pixi.js";

export class HelloWorld extends BaseEntity implements Entity {
  sprite: GameSprite;

  constructor() {
    super();
    console.log("Created a new HelloWorld");

    const graphics = new Graphics();
    graphics.beginFill(0xff0000);
    graphics.drawCircle(10, 10, 5);
    graphics.endFill();

    this.sprite = graphics;
  }

  onAdd() {
    console.log("Hello World added");
  }

  onDestroy() {
    console.log("Hello World destroyed");
  }

  onKeyDown(key: KeyCode) {
    console.log("Hello World keyDown:", key);
  }

  onTick() {
    this.sprite.x = (this.sprite.x + 1) % 300;
  }
}
