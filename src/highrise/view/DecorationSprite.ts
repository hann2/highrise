import img_bathroom from "../../../resources/images/environment/bathroom.png";
import img_fancyFurniture from "../../../resources/images/environment/fancy-furniture.png";
import img_fencesLights from "../../../resources/images/environment/fences-lights.png";
import img_carpet from "../../../resources/images/environment/floor/carpet.png";
import img_cement from "../../../resources/images/environment/floor/cement.png";
import img_industrialCarpet001 from "../../../resources/images/environment/floor/IndustrialCarpet-001.jpg";
import img_industrialCarpet002 from "../../../resources/images/environment/floor/IndustrialCarpet-002.jpg";
import img_oakFloor from "../../../resources/images/environment/floor/oak-floor.png";
import img_oldPlankFlooring1 from "../../../resources/images/environment/floor/old-plank-flooring-1.png";
import img_oldPlankFlooring2 from "../../../resources/images/environment/floor/old-plank-flooring-2.png";
import img_furniture from "../../../resources/images/environment/furniture.png";
import img_market from "../../../resources/images/environment/market.png";
import { V, V2d } from "../../core/Vector";

/**
 * Links scaling of sprites so that pixels/meter is the same
 *
 * Useful if you have a bunch of potted plants and want all the pots to be the
 *    same size, even if the sprites and objects are very different sizes.
 */
const relativeTo = (
  partial: Omit<DecorationSprite, "heightMeters">,
  decorationSprite: DecorationSprite
): DecorationSprite => {
  return {
    ...partial,
    heightMeters:
      (decorationSprite.heightMeters * partial.dimensions.y) /
      decorationSprite.dimensions.y,
  } as DecorationSprite;
};

export interface DecorationSprite {
  imageName: string;
  offset: V2d; // in pixes
  dimensions: V2d; // in pixels
  heightMeters: number; // height of object in world space (meters)
  rotation?: number; // in radians CCW
}

export const rightToilet1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(48, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const leftToilet1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(96, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const downToilet1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(146, 300),
  dimensions: V(46, 68),
  heightMeters: 1.2,
};

export const downToilet2: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(192, 300),
  dimensions: V(46, 68),
  heightMeters: 1.2,
};

export const rightToilet2: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(240, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const leftToilet2: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(288, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const downSink1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(0, 376),
  dimensions: V(47, 68),
  heightMeters: 1,
};

export const downSink2: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(48, 376),
  dimensions: V(47, 68),
  heightMeters: 1,
};

export const rightSink1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(96, 372),
  dimensions: V(48, 68),
  heightMeters: 1.2,
};

export const leftSink1: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(144, 372),
  dimensions: V(48, 68),
  heightMeters: 1.2,
};

export const bathroomTiles: DecorationSprite = {
  imageName: img_bathroom,
  offset: V(36, 180),
  dimensions: V(24, 24),
  heightMeters: 1,
};

export const lobbyDesk: DecorationSprite = {
  imageName: img_market,
  offset: V(97, 84),
  dimensions: V(143, 49),
  heightMeters: 1.2,
};

export const chairRight: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(485, 24),
  dimensions: V(38, 60),
  heightMeters: 1.8,
};

export const chairUp: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(438, 24),
  dimensions: V(38, 60),
  heightMeters: 1.8,
};

export const endTable1: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(52, 8),
  dimensions: V(38, 40),
  heightMeters: 1.3,
};

export const endTable2: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(150, 5),
  dimensions: V(36, 43),
  heightMeters: 1.3,
};

export const lamp: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(300, 0),
  dimensions: V(26, 48),
  heightMeters: 0.2,
};

export const coffeeTable: DecorationSprite = {
  imageName: img_furniture,
  offset: V(352, 160),
  dimensions: V(32, 64),
  heightMeters: 2,
};

export const column: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(338, 48),
  dimensions: V(46, 144),
  heightMeters: 8,
};

export const rug: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(528, 432),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const piano: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(24, 408),
  dimensions: V(116, 96),
  heightMeters: 2.5,
};

export const shelfEmpty: DecorationSprite = {
  imageName: img_furniture,
  offset: V(384, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const shelfJars: DecorationSprite = {
  imageName: img_furniture,
  offset: V(416, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const shelfBooks: DecorationSprite = {
  imageName: img_furniture,
  offset: V(448, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const bakeryStall: DecorationSprite = {
  imageName: img_market,
  offset: V(0, 528),
  dimensions: V(96, 95),
  heightMeters: 3,
};

export const jewelryStall: DecorationSprite = {
  imageName: img_market,
  offset: V(0, 624),
  dimensions: V(96, 95),
  heightMeters: 3,
};

export const garbageCan: DecorationSprite = {
  imageName: img_fencesLights,
  offset: V(486, 322),
  dimensions: V(21, 29),
  heightMeters: 1,
};

export const boxes: DecorationSprite = {
  imageName: img_fencesLights,
  offset: V(196, 287),
  dimensions: V(25, 32),
  heightMeters: 1,
};

export const sack: DecorationSprite = {
  imageName: img_market,
  offset: V(337, 724),
  dimensions: V(47, 41),
  heightMeters: 0.8,
};

export const appleTray1: DecorationSprite = {
  imageName: img_market,
  offset: V(2, 113),
  dimensions: V(43, 29),
  heightMeters: 0.5,
};

export const appleTray2: DecorationSprite = {
  imageName: img_market,
  offset: V(52, 113),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const carrotTray: DecorationSprite = {
  imageName: img_market,
  offset: V(52, 161),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const potatoTray: DecorationSprite = {
  imageName: img_market,
  offset: V(0, 624),
  dimensions: V(96, 29),
  heightMeters: 0.5,
};

export const lettuceTray: DecorationSprite = {
  imageName: img_market,
  offset: V(1, 209),
  dimensions: V(44, 29),
  heightMeters: 0.5,
};

export const pearTray: DecorationSprite = {
  imageName: img_market,
  offset: V(52, 209),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const tailorStall: DecorationSprite = {
  imageName: img_market,
  offset: V(96, 528),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const produceStall: DecorationSprite = {
  imageName: img_market,
  offset: V(240, 528),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const butcherStall: DecorationSprite = {
  imageName: img_market,
  offset: V(240, 624),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const redWineCrate: DecorationSprite = {
  imageName: img_market,
  offset: V(0, 720),
  dimensions: V(48, 48),
  heightMeters: 1,
};

export const whiteWineCrate: DecorationSprite = {
  imageName: img_market,
  offset: V(48, 720),
  dimensions: V(48, 48),
  heightMeters: 1,
};

export const mushroomBasket1: DecorationSprite = {
  imageName: img_market,
  offset: V(198, 726),
  dimensions: V(36, 36),
  heightMeters: 0.5,
};

export const mushroomBasket2: DecorationSprite = {
  imageName: img_market,
  offset: V(246, 726),
  dimensions: V(36, 36),
  heightMeters: 0.5,
};

export const wineRack: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(240, 672),
  dimensions: V(48, 96),
  heightMeters: 3,
};

export const wardrobe1: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(480, 288),
  dimensions: V(37, 144),
  heightMeters: 4,
};

export const wardrobe2: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(537, 288),
  dimensions: V(39, 144),
  heightMeters: 4,
};

export const housePlantTall1: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(388, 529),
  dimensions: V(43, 93),
  heightMeters: 2,
};

export const housePlantTall2: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(438, 529),
  dimensions: V(45, 93),
  heightMeters: 2,
};

export const housePlantTall3: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(485, 529),
  dimensions: V(40, 93),
  heightMeters: 2,
};

export const housePlantShort1: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(387, 629),
  dimensions: V(41, 41),
  heightMeters: 1,
};

export const housePlantShort2: DecorationSprite = {
  imageName: img_fancyFurniture,
  offset: V(433, 624),
  dimensions: V(46, 33),
  heightMeters: 0.8,
};

export const wineCabinet: DecorationSprite = {
  imageName: img_furniture,
  offset: V(320, 32),
  dimensions: V(64, 64),
  heightMeters: 2,
};

export const vaseEmpty: DecorationSprite = {
  imageName: img_furniture,
  offset: V(396, 128),
  dimensions: V(14, 30),
  heightMeters: 0.3,
};

export const vaseRose: DecorationSprite = {
  imageName: img_furniture,
  offset: V(428, 128),
  dimensions: V(14, 30),
  heightMeters: 0.3,
};

export const vaseRoses: DecorationSprite = {
  imageName: img_furniture,
  offset: V(455, 128),
  dimensions: V(20, 30),
  heightMeters: 0.3,
};

export const vaseTulips: DecorationSprite = {
  imageName: img_furniture,
  offset: V(487, 128),
  dimensions: V(19, 30),
  heightMeters: 0.3,
};

export const emptyPot: DecorationSprite = {
  imageName: img_furniture,
  offset: V(390, 195),
  dimensions: V(21, 22),
  heightMeters: 0.3,
};

export const treePot: DecorationSprite = relativeTo(
  {
    imageName: img_furniture,
    offset: V(422, 161),
    dimensions: V(20, 56),
  },
  emptyPot
);

export const vinePot: DecorationSprite = relativeTo(
  {
    imageName: img_furniture,
    offset: V(451, 161),
    dimensions: V(26, 56),
  },
  emptyPot
);

export const grassPot: DecorationSprite = relativeTo(
  {
    imageName: img_furniture,
    offset: V(483, 161),
    dimensions: V(27, 56),
  },
  emptyPot
);

export const woodenChairLeft1: DecorationSprite = {
  imageName: img_furniture,
  offset: V(261, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairLeft2: DecorationSprite = {
  imageName: img_furniture,
  offset: V(262, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairUp1: DecorationSprite = {
  imageName: img_furniture,
  offset: V(293, 385),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairUp2: DecorationSprite = {
  imageName: img_furniture,
  offset: V(294, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairDown1: DecorationSprite = {
  imageName: img_furniture,
  offset: V(325, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairDown2: DecorationSprite = {
  imageName: img_furniture,
  offset: V(326, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairRight1: DecorationSprite = {
  imageName: img_furniture,
  offset: V(357, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairRight2: DecorationSprite = {
  imageName: img_furniture,
  offset: V(358, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const breadPlate: DecorationSprite = {
  imageName: img_furniture,
  offset: V(484, 296),
  dimensions: V(24, 17),
  heightMeters: 0.3,
};

export const meatPlate: DecorationSprite = {
  imageName: img_furniture,
  offset: V(385, 420),
  dimensions: V(31, 24),
  heightMeters: 0.3,
};

export const sausagePlate: DecorationSprite = {
  imageName: img_furniture,
  offset: V(449, 421),
  dimensions: V(31, 24),
  heightMeters: 0.3,
};

export const redCarpetUpperLeft: DecorationSprite = {
  imageName: img_carpet,
  offset: V(192, 320),
  dimensions: V(16, 16),
  heightMeters: 0.25,
};

export const redCarpetUpperRight: DecorationSprite = {
  imageName: img_carpet,
  offset: V(240, 320),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerLeft: DecorationSprite = {
  imageName: img_carpet,
  offset: V(192, 320 + 48),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLowerRight: DecorationSprite = {
  imageName: img_carpet,
  offset: V(192 + 48, 320 + 48),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetLeft: DecorationSprite = {
  imageName: img_carpet,
  offset: V(192, 336),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetTop: DecorationSprite = {
  imageName: img_carpet,
  offset: V(208, 320),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetRight: DecorationSprite = {
  imageName: img_carpet,
  offset: V(192 + 48, 336),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetBottom: DecorationSprite = {
  imageName: img_carpet,
  offset: V(208 + 16, 320 + 48),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetCenter: DecorationSprite = {
  imageName: img_carpet,
  offset: V(216, 340),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomRight: DecorationSprite = {
  imageName: img_carpet,
  offset: V(224 + 16, 304),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerBottomLeft: DecorationSprite = {
  imageName: img_carpet,
  offset: V(224, 304),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopRight: DecorationSprite = {
  imageName: img_carpet,
  offset: V(224 + 16, 304 - 16),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const redCarpetInnerTopLeft: DecorationSprite = {
  imageName: img_carpet,
  offset: V(224, 304 - 16),
  dimensions: V(16, 16),
  heightMeters: redCarpetUpperLeft.heightMeters,
};

export const cementFloor: DecorationSprite = {
  imageName: img_cement,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};

export const oakFloor: DecorationSprite = {
  imageName: img_oakFloor,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};

export const oldPlankFloor1: DecorationSprite = {
  imageName: img_oldPlankFlooring1,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};

export const oldPlankFloor2: DecorationSprite = {
  imageName: img_oldPlankFlooring2,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};

export const industrialCarpet1: DecorationSprite = {
  imageName: img_industrialCarpet001,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};

export const industrialCarpet2: DecorationSprite = {
  imageName: img_industrialCarpet002,
  offset: V(0, 0),
  dimensions: V(512, 512),
  heightMeters: 4,
};
