import img_bathroom from "../../../../resources/images/environment/bathroom.png";
import img_bathroomTileFloor1 from "../../../../resources/images/environment/floor/bathroom-tile-floor-1.png";
import img_bathroomTileFloor2 from "../../../../resources/images/environment/floor/bathroom-tile-floor-2.png";
import img_bathroomTileFloor3 from "../../../../resources/images/environment/floor/bathroom-tile-floor-3.png";
import img_bathroomTileFloor4 from "../../../../resources/images/environment/floor/bathroom-tile-floor-4.png";
import img_cement from "../../../../resources/images/environment/floor/cement.png";
import img_granite1 from "../../../../resources/images/environment/floor/granite-1.jpg";
import img_granite2 from "../../../../resources/images/environment/floor/granite-2.jpg";
import img_granite3 from "../../../../resources/images/environment/floor/granite-3.jpg";
import img_industrialCarpet001 from "../../../../resources/images/environment/floor/IndustrialCarpet-001.jpg";
import img_industrialCarpet002 from "../../../../resources/images/environment/floor/IndustrialCarpet-002.jpg";
import img_marble1 from "../../../../resources/images/environment/floor/marble-1.jpg";
import img_oldPlankFlooring1 from "../../../../resources/images/environment/floor/old-plank-flooring-1.png";
import img_oldPlankFlooring2 from "../../../../resources/images/environment/floor/old-plank-flooring-2.png";
import img_steelFloor from "../../../../resources/images/environment/floor/steel-floor.png";
import img_tileFloor1 from "../../../../resources/images/environment/floor/tile-floor-1.png";
import img_tileFloor10 from "../../../../resources/images/environment/floor/tile-floor-10.jpg";
import img_tileFloor2 from "../../../../resources/images/environment/floor/tile-floor-2.png";
import img_tileFloor3 from "../../../../resources/images/environment/floor/tile-floor-3.png";
import img_tileFloor4 from "../../../../resources/images/environment/floor/tile-floor-4.png";
import img_tileFloor5 from "../../../../resources/images/environment/floor/tile-floor-5.png";
import img_tileFloor6 from "../../../../resources/images/environment/floor/tile-floor-6.png";
import img_tileFloor7 from "../../../../resources/images/environment/floor/tile-floor-7.png";
import img_tileFloor8 from "../../../../resources/images/environment/floor/tile-floor-8.png";
import img_tileFloor9 from "../../../../resources/images/environment/floor/tile-floor-9.jpg";
import img_woodFloor1 from "../../../../resources/images/environment/floor/wood-floor-1.png";
import img_woodFloor2 from "../../../../resources/images/environment/floor/wood-floor-2.png";
import img_woodFloor3 from "../../../../resources/images/environment/floor/wood-floor-3.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const cementFloor: DecorationInfo = {
  imageName: img_cement,
  heightMeters: 4,
};

export const woodFloor1: DecorationInfo = {
  imageName: img_woodFloor1,
  heightMeters: 4,
};

export const woodFloor2: DecorationInfo = {
  imageName: img_woodFloor2,
  heightMeters: 3.8,
};

export const woodFloor3: DecorationInfo = {
  imageName: img_woodFloor3,
  heightMeters: 4,
};

export const woodFloor4: DecorationInfo = {
  imageName: img_woodFloor3,
  heightMeters: 4,
};

export const oldPlankFloor1: DecorationInfo = {
  imageName: img_oldPlankFlooring1,
  heightMeters: 4,
};

export const oldPlankFloor2: DecorationInfo = {
  imageName: img_oldPlankFlooring2,
  heightMeters: 4,
};

export const carpetFloor1: DecorationInfo = {
  imageName: img_industrialCarpet001,
  heightMeters: 4,
};

export const carpetFloor2: DecorationInfo = {
  imageName: img_industrialCarpet002,
  heightMeters: 4,
};

export const tilesFloor1: DecorationInfo = {
  imageName: img_tileFloor1,
  heightMeters: 3.9,
};

export const tilesFloor2: DecorationInfo = {
  imageName: img_tileFloor2,
  heightMeters: 1.8,
};

export const tilesFloor3: DecorationInfo = {
  imageName: img_tileFloor3,
  heightMeters: 3,
};

export const tilesFloor4: DecorationInfo = {
  imageName: img_tileFloor4,
  heightMeters: 2,
};

export const tilesFloor5: DecorationInfo = {
  imageName: img_tileFloor5,
  heightMeters: 3,
};

export const tilesFloor6: DecorationInfo = {
  imageName: img_tileFloor6,
  heightMeters: 1,
};

export const tilesFloor7: DecorationInfo = {
  imageName: img_tileFloor7,
  heightMeters: 2.2,
};

export const tilesFloor8: DecorationInfo = {
  imageName: img_tileFloor8,
  heightMeters: 3.0,
};

export const tilesFloor9: DecorationInfo = {
  imageName: img_tileFloor9,
  heightMeters: 1.8,
};

export const tilesFloor10: DecorationInfo = {
  imageName: img_tileFloor10,
  heightMeters: 3.0,
};

export const bathroomTilesFloor1: DecorationInfo = {
  imageName: img_bathroomTileFloor1,
  heightMeters: 0.9,
};

export const bathroomTilesFloor2: DecorationInfo = {
  imageName: img_bathroomTileFloor2,
  heightMeters: 0.4,
};

export const bathroomTilesFloor3: DecorationInfo = {
  imageName: img_bathroomTileFloor3,
  heightMeters: 0.35,
};

export const bathroomTilesFloor4: DecorationInfo = {
  imageName: img_bathroomTileFloor4,
  heightMeters: 0.3,
};

export const bathroomTilesFloor5: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(36, 180), dimensions: V(24, 24) },
  heightMeters: 1,
};

export const marbleFloor1: DecorationInfo = {
  imageName: img_marble1,
  heightMeters: 1.7,
};

export const graniteFloor1: DecorationInfo = {
  imageName: img_granite1,
  heightMeters: 4,
};

export const graniteFloor2: DecorationInfo = {
  imageName: img_granite2,
  heightMeters: 4,
};

export const graniteFloor3: DecorationInfo = {
  imageName: img_granite3,
  heightMeters: 4,
};

export const steelFloor1: DecorationInfo = {
  imageName: img_steelFloor,
  heightMeters: 0.5,
  sheetInfo: { offset: V(0, 32), dimensions: V(64, 64) },
};

export const steelFloor2: DecorationInfo = {
  imageName: img_steelFloor,
  heightMeters: 0.5,
  sheetInfo: { offset: V(64, 32), dimensions: V(64, 64) },
};

export const steelFloor3: DecorationInfo = {
  imageName: img_steelFloor,
  heightMeters: 0.5,
  sheetInfo: { offset: V(128, 32), dimensions: V(64, 64) },
};

export const steelFloor4: DecorationInfo = {
  imageName: img_steelFloor,
  heightMeters: 0.5,
  sheetInfo: { offset: V(192, 32), dimensions: V(64, 64) },
};

export const steelFloor5: DecorationInfo = {
  imageName: img_steelFloor,
  heightMeters: 0.5,
  sheetInfo: { offset: V(256, 32), dimensions: V(64, 64) },
};
