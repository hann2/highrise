import { Container, Graphics, Text, TextStyleOptions } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { fontName } from "../../core/resources/resourceUtils";
import { V2d } from "../../core/Vector";
import { RunPlan } from "../run/RunPlan";

// All in meters
const WIDTH = 3.4;
const PADDING = 0.18;
const HEADER_HEIGHT = 0.42;
const ROW_HEIGHT = 0.34;
const TEXT_HEIGHT = 0.24;
const FOOTER_HEIGHT = 0.36;
/** Pixi text is drawn at this size and scaled down to meters */
const FONT_SIZE = 64;

const BOARD_COLOR = 0x121212;
const BRASS = "#c9a45c";
const WHITE = "#f2efe6";
const NOTE_COLOR = "#e0533d";

/**
 * The building directory by the stairs: the floors of the run ahead, top floor
 * first, with notes on anything notable. It just shows what the plan says.
 */
export default class DirectoryBoard extends BaseEntity implements Entity {
  tags = ["directory_board"];
  sprite: Container & GameSprite;
  /** Each row as written on the board, top to bottom, for tests */
  readonly rows: string[] = [];

  constructor(
    /** Middle of the top edge, against the wall, in world coordinates */
    topCenter: V2d,
    plan: RunPlan,
  ) {
    super();

    const floors = [...plan].reverse();
    // Floors, plus the lobby at the bottom
    const rowCount = floors.length + 1;
    const height =
      PADDING * 2 + HEADER_HEIGHT + rowCount * ROW_HEIGHT + FOOTER_HEIGHT;
    const left = -WIDTH / 2 + PADDING;
    const right = WIDTH / 2 - PADDING;

    this.sprite = new Container();
    this.sprite.layerName = Layer.FURNITURE;
    this.sprite.position.set(topCenter.x, topCenter.y + height / 2);

    const top = -height / 2;
    const headerBottom = top + PADDING + HEADER_HEIGHT;
    const board = new Graphics()
      .roundRect(-WIDTH / 2, top, WIDTH, height, 0.08)
      .fill(BOARD_COLOR)
      .stroke({ width: 0.05, color: BRASS })
      .moveTo(left, headerBottom)
      .lineTo(right, headerBottom)
      .stroke({ width: 0.02, color: BRASS });
    this.sprite.addChild(board);

    this.addText("DIRECTORY", 0, top + PADDING + HEADER_HEIGHT / 2, {
      height: 0.3,
      color: BRASS,
      anchorX: 0.5,
      style: { letterSpacing: 12, fontWeight: "bold" },
    });

    const numberColumn = left + 0.1;
    const nameColumn = left + 0.45;
    const rowY = (i: number) => headerBottom + (i + 0.5) * ROW_HEIGHT;
    floors.forEach((floor, i) => {
      const y = rowY(i);
      this.addText(String(floor.number), numberColumn, y, {
        color: BRASS,
        anchorX: 0.5,
      });
      this.addText(floor.name.toUpperCase(), nameColumn, y, { color: WHITE });
      if (floor.notes.length > 0) {
        this.addText(floor.notes.join(" · ").toUpperCase(), right, y, {
          color: NOTE_COLOR,
          height: TEXT_HEIGHT * 0.8,
          anchorX: 1,
        });
      }
      this.rows.push(
        [floor.number, floor.name, ...floor.notes].join(" ").trim(),
      );
    });

    const lobbyY = rowY(floors.length);
    this.addText("L", numberColumn, lobbyY, { color: BRASS, anchorX: 0.5 });
    this.addText("LOBBY", nameColumn, lobbyY, { color: WHITE });
    this.addText("YOU ARE HERE", right, lobbyY, {
      color: BRASS,
      height: TEXT_HEIGHT * 0.8,
      anchorX: 1,
    });
    this.rows.push("L Lobby");

    this.addText("STAIRS →", right, height / 2 - PADDING - FOOTER_HEIGHT / 2, {
      color: WHITE,
      height: TEXT_HEIGHT * 0.9,
      anchorX: 1,
      style: { fontWeight: "bold" },
    });

    this.body = createRigid2D({
      motion: "static",
      position: [this.sprite.position.x, this.sprite.position.y],
    });
    this.body.addShape(
      new Box({
        width: WIDTH,
        height,
        collisionGroup: CollisionGroups.Furniture,
        collisionMask: CollisionGroups.All,
      }),
    );
  }

  private addText(
    text: string,
    x: number,
    y: number,
    {
      height = TEXT_HEIGHT,
      color,
      anchorX = 0,
      style = {},
    }: {
      height?: number;
      color: string;
      anchorX?: number;
      style?: Partial<TextStyleOptions>;
    },
  ) {
    const sprite = new Text({
      text,
      style: {
        fontSize: FONT_SIZE,
        fontFamily: fontName("oswald"),
        fill: color,
        ...style,
      },
    });
    sprite.anchor.set(anchorX, 0.5);
    sprite.scale.set(height / FONT_SIZE);
    sprite.position.set(x, y);
    this.sprite.addChild(sprite);
  }
}
