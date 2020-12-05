import bathroom from "../../../resources/images/bathroom.png";
import fancyFurniture from "../../../resources/images/fancy-furniture.png";
import furniture from "../../../resources/images/furniture.png";
import market from "../../../resources/images/market.png";
import { V, V2d } from "../../core/Vector";

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
  heightMeters: 1.5,
};

export const downToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(192, 300),
  dimensions: V(46, 68),
  heightMeters: 1.5,
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
