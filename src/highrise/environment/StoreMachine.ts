import { Sprite } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite, loadGameSprite } from "../../core/entity/GameSprite";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { V2d } from "../../core/Vector";
import type Human from "../human/Human";
import type { Shelf } from "../items/shelf";
import Light from "../lighting-and-vision/Light";
import StoreScreen, { isStoreOpen } from "../menu/StoreScreen";
import Interactable from "./Interactable";

// Meters
const SIZE = 1.5;
/** How close you have to be to browse */
const INTERACT_RANGE = 1.5;

/**
 * The store: a vending machine in the arrival room of every floor but the
 * first. E opens `StoreScreen`, with the game paused, to buy from the shelf
 * that was dealt for this floor. Can be browsed as often as you like until you
 * leave the room. Unbreakable, unlike the snack machines out on the floor.
 * (Borrows the vending machine art until it has its own.)
 */
export default class StoreMachine extends BaseEntity implements Entity {
  tags = ["store_machine"];
  sprite: Sprite & GameSprite;
  interactable: Interactable;

  constructor(
    readonly position: V2d,
    rotation: number,
    /** Read when browsing, because the shelf is dealt after the room is built */
    private getShelf: () => Shelf | undefined,
  ) {
    super();

    this.sprite = loadGameSprite("vendingMachine2", Layer.WORLD);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.copyFrom(position);
    this.sprite.width = SIZE;
    this.sprite.height = SIZE;
    this.sprite.rotation = rotation;

    const glow = Sprite.from("vendingMachineGlow2");
    glow.anchor.set(0.5, 0.5);
    glow.width = SIZE;
    glow.height = SIZE;
    glow.rotation = rotation;
    this.addChild(new Light(glow, false, 2)).setPosition(position);

    this.body = createRigid2D({ motion: "static", position, angle: rotation });
    this.body.addShape(
      new Box({
        width: 1.1,
        height: 0.9,
        position: [0, 0.3],
        collisionGroup: CollisionGroups.Walls,
        collisionMask: CollisionGroups.All,
      }),
    );

    this.interactable = this.addChild(
      new Interactable(position, (human) => this.browse(human), INTERACT_RANGE),
    );
    this.interactable.highlightRadius = 0.85;
    this.interactable.canInteract = () => this.shelf !== undefined;
    this.interactable.prompt = () => ({
      title: "Vending machine",
      action: "Browse",
    });
  }

  get shelf(): Shelf | undefined {
    return this.getShelf();
  }

  browse(human: Human) {
    const shelf = this.shelf;
    if (!shelf || isStoreOpen(this.game)) {
      return;
    }
    this.game.addEntity(
      new PositionalSound("quarterDrop1", this.position, { speed: 1.2 }),
    );
    this.game.addEntity(new StoreScreen(shelf, human));
  }
}
