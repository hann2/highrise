import { CompositeRectTileLayer } from "pixi-tilemap";
import { Texture } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { Layers } from "../../layers";
import { DecorationSprite } from "../../view/DecorationSprite";

export type Tiles = (DecorationSprite | undefined)[][];

export default class TiledFloor extends BaseEntity implements Entity {
  constructor(position: V2d, tileDimensions: V2d, tiles: Tiles) {
    super();

    const exampleTile: DecorationSprite = this.getExampleTile(tiles)!;
    const scale = tileDimensions.x / exampleTile.dimensions.x;
    const tileLayer = new CompositeRectTileLayer(0, [
      Texture.from(exampleTile.imageName, {}),
    ]);
    tileLayer.scale.set(scale, scale);

    const [tileW, tileH] = tileDimensions;

    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles[i].length; j++) {
        const tile: DecorationSprite | undefined = tiles[i][j];
        if (!tile) {
          continue;
        }
        const childPosition = position
          .add(V(i * tileW, j * tileH))
          // Have to reverse the scale from above for these positions
          .mul(1 / scale);

        tileLayer.addRect(
          0,
          tile.offset.x,
          tile.offset.y,
          childPosition.x,
          childPosition.y,
          tile.dimensions.x,
          tile.dimensions.y
        );
      }
    }

    this.sprite = tileLayer;
    this.sprite.layerName = Layers.FLOOR;
  }

  getExampleTile(tiles: Tiles) {
    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles[i].length; j++) {
        if (tiles[i] && tiles[i][j]) {
          return tiles[i][j];
        }
      }
    }
  }
}
