import { CompositeRectTileLayer } from "pixi-tilemap";
import { Texture } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { Layers } from "../config/layers";
import { DecorationInfo } from "./decorations/DecorationInfo";

export type Tiles = ((DecorationInfo & {}) | undefined)[][];

export default class TiledFloor extends BaseEntity implements Entity {
  constructor(position: V2d, tileDimensions: V2d, tiles: Tiles) {
    super();

    const exampleTile: DecorationInfo = this.getExampleTile(tiles);
    const scale = tileDimensions.x / exampleTile.sheetInfo!.dimensions.x;
    const tileLayer = new CompositeRectTileLayer(0, [
      Texture.from(exampleTile.imageName, {}),
    ]);
    tileLayer.scale.set(scale, scale);

    const [tileW, tileH] = tileDimensions;

    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles[i].length; j++) {
        const tile: DecorationInfo | undefined = tiles[i][j];
        if (!tile) {
          continue;
        }

        const { offset, dimensions } = tile.sheetInfo!;

        const childPosition = position
          .add(V(i * tileW, j * tileH))
          // Have to reverse the scale from above for these positions
          .mul(1 / scale);

        tileLayer.addRect(
          0,
          offset.x,
          offset.y,
          childPosition.x,
          childPosition.y,
          dimensions.x,
          dimensions.y
        );
      }
    }

    this.sprite = tileLayer;
    this.sprite.layerName = Layers.FLOOR;
  }

  // Grab the first non-empty tile to look at
  getExampleTile(tiles: Tiles): DecorationInfo {
    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles[i].length; j++) {
        const tile = tiles[i][j];
        if (tile) {
          return tile;
        }
      }
    }
    throw new Error("All tiles were blank");
  }
}
