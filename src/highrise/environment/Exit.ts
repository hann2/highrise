import { Sprite } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { V } from "../../core/Vector";
import Interactable from "./Interactable";
import { OverheadLight } from "./lighting/OverheadLight";
import { getPartyLeader } from "./PartyManager";

export default class Exit extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  /** Only there to say what the stairs are when they're the nearest thing */
  interactable: Interactable;

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    direction: number,
    /**
     * What happens when something steps on the stairs. By default the
     * party leader finishes the floor.
     */
    private onReached?: (other: Entity) => void,
  ) {
    super();

    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    this.sprite = Sprite.from("stairs");
    this.sprite.layerName = Layer.DECORATIONS;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(x1 + w / 2, y1 + h / 2);
    this.sprite.width = w;
    this.sprite.height = h;
    this.sprite.rotation = direction;

    const position = V(Math.min(x1, x2) + w / 2, Math.min(y1, y2) + h / 2);
    this.body = createRigid2D({
      motion: "static",
      position,
      collisionResponse: false,
    });
    this.body.addShape(
      new Box({
        width: w,
        height: h,
        collisionGroup: CollisionGroups.Sensors,
        collisionMask: CollisionGroups.Humans,
      }),
    );

    this.addChild(new OverheadLight(position));

    // You take the stairs by walking onto them, so E doesn't use them
    this.interactable = this.addChild(
      new Interactable(position, undefined, Math.max(w, h) / 2 + 1.5),
    );
    this.interactable.passive = true;
    this.interactable.prompt = () => ({ title: "Stairs up" });
  }

  @on("beginContact")
  onBeginContact({ other }: { other?: Entity }) {
    if (!other) {
      return;
    }
    if (this.onReached) {
      this.onReached(other);
    } else if (other === getPartyLeader(this.game)) {
      this.game.dispatch("levelComplete", undefined);
    }
  }
}
