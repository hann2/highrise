import bathroom from "../../../resources/images/environment/bathroom.png";
import fancyFurniture from "../../../resources/images/environment/fancy-furniture.png";
import fencesLights from "../../../resources/images/environment/fences-lights.png";
import furniture from "../../../resources/images/environment/furniture.png";
import market from "../../../resources/images/environment/market.png";
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
}

export const rightToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(48, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const leftToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const downToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(146, 300),
  dimensions: V(46, 68),
  heightMeters: 1.2,
};

export const downToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(192, 300),
  dimensions: V(46, 68),
  heightMeters: 1.2,
};

export const rightToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(240, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const leftToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(288, 300),
  dimensions: V(48, 68),
  heightMeters: 1.5,
};

export const downSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(0, 376),
  dimensions: V(47, 68),
  heightMeters: 1,
};

export const downSink2: DecorationSprite = {
  imageName: bathroom,
  offset: V(48, 376),
  dimensions: V(47, 68),
  heightMeters: 1,
};

export const rightSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 372),
  dimensions: V(48, 68),
  heightMeters: 1.2,
};

export const leftSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(144, 372),
  dimensions: V(48, 68),
  heightMeters: 1.2,
};

export const bathroomTiles: DecorationSprite = {
  imageName: bathroom,
  offset: V(36, 180),
  dimensions: V(24, 24),
  heightMeters: 1,
};

export const lobbyDesk: DecorationSprite = {
  imageName: market,
  offset: V(97, 84),
  dimensions: V(143, 49),
  heightMeters: 1.2,
};

export const chairRight: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(485, 24),
  dimensions: V(38, 60),
  heightMeters: 1.8,
};

export const chairUp: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(438, 24),
  dimensions: V(38, 60),
  heightMeters: 1.8,
};

export const endTable1: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(52, 8),
  dimensions: V(38, 40),
  heightMeters: 1.3,
};

export const endTable2: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(150, 5),
  dimensions: V(36, 43),
  heightMeters: 1.3,
};

export const lamp: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(300, 0),
  dimensions: V(26, 48),
  heightMeters: 0.2,
};

export const coffeeTable: DecorationSprite = {
  imageName: furniture,
  offset: V(352, 160),
  dimensions: V(32, 64),
  heightMeters: 2,
};

export const column: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(338, 48),
  dimensions: V(46, 144),
  heightMeters: 8,
};

export const rug: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(528, 432),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const piano: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(24, 408),
  dimensions: V(116, 96),
  heightMeters: 2.5,
};

export const shelfEmpty: DecorationSprite = {
  imageName: furniture,
  offset: V(384, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const shelfJars: DecorationSprite = {
  imageName: furniture,
  offset: V(416, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const shelfBooks: DecorationSprite = {
  imageName: furniture,
  offset: V(448, 385),
  dimensions: V(32, 31),
  heightMeters: 1.3,
};

export const bakeryStall: DecorationSprite = {
  imageName: market,
  offset: V(0, 528),
  dimensions: V(96, 95),
  heightMeters: 3,
};

export const jewelryStall: DecorationSprite = {
  imageName: market,
  offset: V(0, 624),
  dimensions: V(96, 95),
  heightMeters: 3,
};

export const garbageCan: DecorationSprite = {
  imageName: fencesLights,
  offset: V(486, 322),
  dimensions: V(21, 29),
  heightMeters: 1,
};

export const boxes: DecorationSprite = {
  imageName: fencesLights,
  offset: V(196, 287),
  dimensions: V(25, 32),
  heightMeters: 1,
};

export const sack: DecorationSprite = {
  imageName: market,
  offset: V(337, 724),
  dimensions: V(47, 41),
  heightMeters: 0.8,
};

export const appleTray1: DecorationSprite = {
  imageName: market,
  offset: V(2, 113),
  dimensions: V(43, 29),
  heightMeters: 0.5,
};

export const appleTray2: DecorationSprite = {
  imageName: market,
  offset: V(52, 113),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const carrotTray: DecorationSprite = {
  imageName: market,
  offset: V(52, 161),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const potatoTray: DecorationSprite = {
  imageName: market,
  offset: V(0, 624),
  dimensions: V(96, 29),
  heightMeters: 0.5,
};

export const lettuceTray: DecorationSprite = {
  imageName: market,
  offset: V(1, 209),
  dimensions: V(44, 29),
  heightMeters: 0.5,
};

export const pearTray: DecorationSprite = {
  imageName: market,
  offset: V(52, 209),
  dimensions: V(42, 29),
  heightMeters: 0.5,
};

export const tailorStall: DecorationSprite = {
  imageName: market,
  offset: V(96, 528),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const produceStall: DecorationSprite = {
  imageName: market,
  offset: V(240, 528),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const butcherStall: DecorationSprite = {
  imageName: market,
  offset: V(240, 624),
  dimensions: V(144, 96),
  heightMeters: 3,
};

export const redWineCrate: DecorationSprite = {
  imageName: market,
  offset: V(0, 720),
  dimensions: V(48, 48),
  heightMeters: 1,
};

export const whiteWineCrate: DecorationSprite = {
  imageName: market,
  offset: V(48, 720),
  dimensions: V(48, 48),
  heightMeters: 1,
};

export const mushroomBasket1: DecorationSprite = {
  imageName: market,
  offset: V(198, 726),
  dimensions: V(36, 36),
  heightMeters: 0.5,
};

export const mushroomBasket2: DecorationSprite = {
  imageName: market,
  offset: V(246, 726),
  dimensions: V(36, 36),
  heightMeters: 0.5,
};

export const wineRack: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(240, 672),
  dimensions: V(48, 96),
  heightMeters: 3,
};

export const wardrobe1: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(480, 288),
  dimensions: V(37, 144),
  heightMeters: 4,
};

export const wardrobe2: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(537, 288),
  dimensions: V(39, 144),
  heightMeters: 4,
};

export const housePlantTall1: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(388, 529),
  dimensions: V(43, 93),
  heightMeters: 2,
};

export const housePlantTall2: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(438, 529),
  dimensions: V(45, 93),
  heightMeters: 2,
};

export const housePlantTall3: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(485, 529),
  dimensions: V(40, 93),
  heightMeters: 2,
};

export const housePlantShort1: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(387, 629),
  dimensions: V(41, 41),
  heightMeters: 1,
};

export const housePlantShort2: DecorationSprite = {
  imageName: fancyFurniture,
  offset: V(433, 624),
  dimensions: V(46, 33),
  heightMeters: 0.8,
};

export const wineCabinet: DecorationSprite = {
  imageName: furniture,
  offset: V(320, 32),
  dimensions: V(64, 64),
  heightMeters: 2,
};

export const vaseEmpty: DecorationSprite = {
  imageName: furniture,
  offset: V(396, 128),
  dimensions: V(14, 30),
  heightMeters: 0.3,
};

export const vaseRose: DecorationSprite = {
  imageName: furniture,
  offset: V(428, 128),
  dimensions: V(14, 30),
  heightMeters: 0.3,
};

export const vaseRoses: DecorationSprite = {
  imageName: furniture,
  offset: V(455, 128),
  dimensions: V(20, 30),
  heightMeters: 0.3,
};

export const vaseTulips: DecorationSprite = {
  imageName: furniture,
  offset: V(487, 128),
  dimensions: V(19, 30),
  heightMeters: 0.3,
};

export const emptyPot: DecorationSprite = {
  imageName: furniture,
  offset: V(390, 195),
  dimensions: V(21, 22),
  heightMeters: 0.3,
};

export const treePot: DecorationSprite = relativeTo(
  {
    imageName: furniture,
    offset: V(422, 161),
    dimensions: V(20, 56),
  },
  emptyPot
);

export const vinePot: DecorationSprite = relativeTo(
  {
    imageName: furniture,
    offset: V(451, 161),
    dimensions: V(26, 56),
  },
  emptyPot
);

export const grassPot: DecorationSprite = relativeTo(
  {
    imageName: furniture,
    offset: V(483, 161),
    dimensions: V(27, 56),
  },
  emptyPot
);

export const woodenChairLeft1: DecorationSprite = {
  imageName: furniture,
  offset: V(261, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairLeft2: DecorationSprite = {
  imageName: furniture,
  offset: V(262, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairUp1: DecorationSprite = {
  imageName: furniture,
  offset: V(293, 385),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairUp2: DecorationSprite = {
  imageName: furniture,
  offset: V(294, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairDown1: DecorationSprite = {
  imageName: furniture,
  offset: V(325, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairDown2: DecorationSprite = {
  imageName: furniture,
  offset: V(326, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairRight1: DecorationSprite = {
  imageName: furniture,
  offset: V(357, 384),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const woodenChairRight2: DecorationSprite = {
  imageName: furniture,
  offset: V(358, 416),
  dimensions: V(22, 32),
  heightMeters: 1,
};

export const breadPlate: DecorationSprite = {
  imageName: furniture,
  offset: V(484, 296),
  dimensions: V(24, 17),
  heightMeters: 0.3,
};

export const meatPlate: DecorationSprite = {
  imageName: furniture,
  offset: V(385, 420),
  dimensions: V(31, 24),
  heightMeters: 0.3,
};

export const sausagePlate: DecorationSprite = {
  imageName: furniture,
  offset: V(449, 421),
  dimensions: V(31, 24),
  heightMeters: 0.3,
};
