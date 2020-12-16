import img_bookcase1 from "../../../../resources/images/environment/bookcase-1.png";
import img_bookcase2 from "../../../../resources/images/environment/bookcase-2.png";
import img_fencesLights from "../../../../resources/images/environment/fences-lights.png";
import img_market from "../../../../resources/images/environment/market.png";
import img_waterCooler from "../../../../resources/images/environment/water-cooler.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const bookcase1: DecorationInfo = {
  imageName: img_bookcase1,
  heightMeters: 1.4,
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

export const boxes: DecorationInfo = {
  imageName: img_fencesLights,
  sheetInfo: { offset: V(196, 287), dimensions: V(25, 32) },
  heightMeters: 1,
};

export const sack: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(337, 724), dimensions: V(47, 41) },
  heightMeters: 0.8,
};

export const garbageCan: DecorationInfo = {
  imageName: img_fencesLights,
  sheetInfo: { offset: V(486, 322), dimensions: V(21, 29) },
  heightMeters: 1,
};
