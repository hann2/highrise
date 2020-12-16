import img_furniture from "../../../../resources/images/environment/furniture.png";
import img_fancyFurniture from "../../../../resources/images/environment/fancy-furniture.png";
import img_market from "../../../../resources/images/environment/market.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const lobbyDesk: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(97, 84), dimensions: V(143, 49) },
  heightMeters: 1.2,
};

export const chairRight: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(485, 24), dimensions: V(38, 60) },
  heightMeters: 1.8,
};

export const chairUp: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(438, 24), dimensions: V(38, 60) },
  heightMeters: 1.8,
};

export const endTable1: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(52, 8), dimensions: V(38, 40) },
  heightMeters: 1.3,
};

export const endTable2: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(150, 5), dimensions: V(36, 43) },
  heightMeters: 1.3,
};

export const lamp: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(300, 0), dimensions: V(26, 48) },
  heightMeters: 0.2,
};

export const coffeeTable: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(352, 160), dimensions: V(32, 64) },
  heightMeters: 2,
};

export const column: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(338, 48), dimensions: V(46, 144) },
  heightMeters: 8,
};

export const rug: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(528, 432), dimensions: V(144, 96) },
  heightMeters: 3,
};

export const piano: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(24, 408), dimensions: V(116, 96) },
  heightMeters: 2.5,
};
