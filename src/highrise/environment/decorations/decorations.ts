import img_bathroom from "../../../../resources/images/environment/bathroom.png";
import img_fancyFurniture from "../../../../resources/images/environment/fancy-furniture.png";
import img_fencesLights from "../../../../resources/images/environment/fences-lights.png";
import img_carpet from "../../../../resources/images/environment/floor/carpet.png";
import img_furniture from "../../../../resources/images/environment/furniture.png";
import img_market from "../../../../resources/images/environment/market.png";
import img_waterCooler from "../../../../resources/images/environment/water-cooler.png";
import { V } from "../../../core/Vector";
import { DecorationInfo, decorationRelativeTo } from "./DecorationInfo";

// Do this so that we can import all decorations from here
export * from "./floorDecorations";
export * from "./bathroomDecorations";

// NOTE: Everything exported by this file is assumed to be a DecorationInfo by the preloaders.
// If you have something else you want to export, consider putting it in a different file.

export const rightToilet1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(48, 300), dimensions: V(48, 68) },
  heightMeters: 1.5,
};

export const leftToilet1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(96, 300), dimensions: V(48, 68) },
  heightMeters: 1.5,
};

export const downToilet1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(146, 300), dimensions: V(46, 68) },
  heightMeters: 1.2,
};

export const downToilet2: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(192, 300), dimensions: V(46, 68) },
  heightMeters: 1.2,
};

export const rightToilet2: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(240, 300), dimensions: V(48, 68) },
  heightMeters: 1.5,
};

export const leftToilet2: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(288, 300), dimensions: V(48, 68) },
  heightMeters: 1.5,
};

export const downSink1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(0, 376), dimensions: V(47, 68) },
  heightMeters: 1,
};

export const downSink2: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(48, 376), dimensions: V(47, 68) },
  heightMeters: 1,
};

export const rightSink1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(96, 372), dimensions: V(48, 68) },
  heightMeters: 1.2,
};

export const leftSink1: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(144, 372), dimensions: V(48, 68) },
  heightMeters: 1.2,
};

export const bathroomTiles: DecorationInfo = {
  imageName: img_bathroom,
  sheetInfo: { offset: V(36, 180), dimensions: V(24, 24) },
  heightMeters: 1,
};

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

export const shelfEmpty: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(384, 385), dimensions: V(32, 31) },
  heightMeters: 1.3,
};

export const shelfJars: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(416, 385), dimensions: V(32, 31) },
  heightMeters: 1.3,
};

export const shelfBooks: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(448, 385), dimensions: V(32, 31) },
  heightMeters: 1.3,
};

export const bakeryStall: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(0, 528), dimensions: V(96, 95) },
  heightMeters: 3,
};

export const jewelryStall: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(0, 624), dimensions: V(96, 95) },
  heightMeters: 3,
};

export const garbageCan: DecorationInfo = {
  imageName: img_fencesLights,
  sheetInfo: { offset: V(486, 322), dimensions: V(21, 29) },
  heightMeters: 1,
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

export const appleTray1: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(2, 113), dimensions: V(43, 29) },
  heightMeters: 0.5,
};

export const appleTray2: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(52, 113), dimensions: V(42, 29) },
  heightMeters: 0.5,
};

export const carrotTray: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(52, 161), dimensions: V(42, 29) },
  heightMeters: 0.5,
};

export const potatoTray: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(0, 624), dimensions: V(96, 29) },
  heightMeters: 0.5,
};

export const lettuceTray: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(1, 209), dimensions: V(44, 29) },
  heightMeters: 0.5,
};

export const pearTray: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(52, 209), dimensions: V(42, 29) },
  heightMeters: 0.5,
};

export const tailorStall: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(96, 528), dimensions: V(144, 96) },
  heightMeters: 3,
};

export const produceStall: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(240, 528), dimensions: V(144, 96) },
  heightMeters: 3,
};

export const butcherStall: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(240, 624), dimensions: V(144, 96) },
  heightMeters: 3,
};

export const redWineCrate: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(0, 720), dimensions: V(48, 48) },
  heightMeters: 1,
};

export const whiteWineCrate: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(48, 720), dimensions: V(48, 48) },
  heightMeters: 1,
};

export const mushroomBasket1: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(198, 726), dimensions: V(36, 36) },
  heightMeters: 0.5,
};

export const mushroomBasket2: DecorationInfo = {
  imageName: img_market,
  sheetInfo: { offset: V(246, 726), dimensions: V(36, 36) },
  heightMeters: 0.5,
};

export const wineRack: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(240, 672), dimensions: V(48, 96) },
  heightMeters: 3,
};

export const wardrobe1: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(480, 288), dimensions: V(37, 144) },
  heightMeters: 4,
};

export const wardrobe2: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(537, 288), dimensions: V(39, 144) },
  heightMeters: 4,
};

export const housePlantTall1: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(388, 529), dimensions: V(43, 93) },
  heightMeters: 2,
};

export const housePlantTall2: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(438, 529), dimensions: V(45, 93) },
  heightMeters: 2,
};

export const housePlantTall3: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(485, 529), dimensions: V(40, 93) },
  heightMeters: 2,
};

export const housePlantShort1: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(387, 629), dimensions: V(41, 41) },
  heightMeters: 1,
};

export const housePlantShort2: DecorationInfo = {
  imageName: img_fancyFurniture,
  sheetInfo: { offset: V(433, 624), dimensions: V(46, 33) },
  heightMeters: 0.8,
};

export const wineCabinet: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(320, 32), dimensions: V(64, 64) },
  heightMeters: 2,
};

export const vaseEmpty: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(396, 128), dimensions: V(14, 30) },
  heightMeters: 0.3,
};

export const vaseRose: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(428, 128), dimensions: V(14, 30) },
  heightMeters: 0.3,
};

export const vaseRoses: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(455, 128), dimensions: V(20, 30) },
  heightMeters: 0.3,
};

export const vaseTulips: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(487, 128), dimensions: V(19, 30) },
  heightMeters: 0.3,
};

export const emptyPot: DecorationInfo = {
  imageName: img_furniture,
  sheetInfo: { offset: V(390, 195), dimensions: V(21, 22) },
  heightMeters: 0.3,
};

export const treePot: DecorationInfo = decorationRelativeTo(
  {
    imageName: img_furniture,
    sheetInfo: { offset: V(422, 161), dimensions: V(20, 56) },
  },
  emptyPot
);

export const vinePot: DecorationInfo = decorationRelativeTo(
  {
    imageName: img_furniture,
    sheetInfo: { offset: V(451, 161), dimensions: V(26, 56) },
  },
  emptyPot
);

export const grassPot: DecorationInfo = decorationRelativeTo(
  {
    imageName: img_furniture,
    sheetInfo: { offset: V(483, 161), dimensions: V(27, 56) },
  },
  emptyPot
);

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

export const redCarpetUpperLeft: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(192, 320), dimensions: V(16, 16) },
  heightMeters: 0.25,
};

export const redCarpetUpperRight: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(240, 320), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerLeft: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(192, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerRight: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(192 + 48, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLeft: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(192, 336), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetTop: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(208, 320), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetRight: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(192 + 48, 336), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetBottom: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(208 + 16, 320 + 48), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetCenter: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(216, 340), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomRight: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(224 + 16, 304), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomLeft: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(224, 304), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopRight: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(224 + 16, 304 - 16), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopLeft: DecorationInfo = {
  imageName: img_carpet,
  sheetInfo: { offset: V(224, 304 - 16), dimensions: V(16, 16) },
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const waterCooler: DecorationInfo = {
  imageName: img_waterCooler,
  heightMeters: 0.6,
};
