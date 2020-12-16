import img_furniture from "../../../../resources/images/environment/furniture.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

// Do this so that we can import all decorations from here
export * from "./bathroomDecorations";
export * from "./floorDecorations";
export * from "./hallwayDecorations";
export * from "./lobbyDecorations";
export * from "./redCarpetDecorations";
export * from "./shopDecorations";

// NOTE: Everything exported by this file is assumed to be a DecorationInfo by the preloaders.
// If you have something else you want to export, consider putting it in a different file.

export const woodenChairLeft1: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(261, 384), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairLeft2: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(262, 416), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairUp1: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(293, 385), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairUp2: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(294, 416), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairDown1: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(325, 384), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairDown2: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(326, 416), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairRight1: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(357, 384), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const woodenChairRight2: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(358, 416), dimensions: V(22, 32) },
  heightMeters: 1,
};

export const breadPlate: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(484, 296), dimensions: V(24, 17) },
  heightMeters: 0.3,
};

export const meatPlate: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(385, 420), dimensions: V(31, 24) },
  heightMeters: 0.3,
};

export const sausagePlate: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(449, 421), dimensions: V(31, 24) },
  heightMeters: 0.3,
};
