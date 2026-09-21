import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const redCarpetUpperLeft: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(192, 320), dimensions: V(16, 16) },
  heightMeters: 0.25,
};

export const redCarpetUpperRight: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(240, 320), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerLeft: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(192, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerRight: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(192 + 48, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLeft: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(192, 336), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetTop: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(208, 320), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetRight: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(192 + 48, 336), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetBottom: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(208 + 16, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetCenter: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(216, 340), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomRight: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(224 + 16, 304), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomLeft: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(224, 304), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopRight: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(224 + 16, 304 - 16), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopLeft: DecorationInfo = {
  imageName: "carpet",
  sheetInfo: { offset: V(224, 304 - 16), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};
