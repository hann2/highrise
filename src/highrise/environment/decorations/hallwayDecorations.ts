import img_bookcase1 from "../../../../resources/images/environment/bookcase-1.png";
import img_bookcase2 from "../../../../resources/images/environment/bookcase-2.png";
import img_boxPile1 from "../../../../resources/images/environment/box-pile-1.png";
import img_boxPile2 from "../../../../resources/images/environment/box-pile-2.png";
import img_boxShelf1 from "../../../../resources/images/environment/box-shelf-1.png";
import img_boxShelf2 from "../../../../resources/images/environment/box-shelf-2.png";
import img_fencesLights from "../../../../resources/images/environment/fences-lights.png";
import img_market from "../../../../resources/images/environment/market.png";
import img_waterCooler from "../../../../resources/images/environment/water-cooler.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const bookcase1: DecorationInfo = {
  imageName: img_bookcase1,
  heightMeters: 1.4,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const bookcase2: DecorationInfo = {
  imageName: img_bookcase2,
  heightMeters: 1.2,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const waterCooler: DecorationInfo = {
  imageName: img_waterCooler,
  heightMeters: 0.6,
  isSolid: true,
  bodyInset: [0.05, 0.05],
};

export const boxPile1: DecorationInfo = {
  imageName: img_boxPile1,
  heightMeters: 1.7,
};

export const boxPile2: DecorationInfo = {
  imageName: img_boxPile2,
  heightMeters: 1.7,
};

export const boxShelf1: DecorationInfo = {
  imageName: img_boxShelf1,
  heightMeters: 1.5,
  isSolid: true,
  bodyInset: [0.2, 0.2],
};

export const boxShelf2: DecorationInfo = {
  imageName: img_boxShelf2,
  heightMeters: 1.5,
  isSolid: true,
  bodyInset: [0.2, 0.2],
};

export const sack: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(337, 724), dimensions: V(47, 41) },
  heightMeters: 0.8,
};
