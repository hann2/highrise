import bathroom from "../../../resources/images/bathroom.png";
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
  heightMeters: 1,
};

export const leftToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 300),
  dimensions: V(48, 68),
  heightMeters: 1,
};

export const downToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(146, 300),
  dimensions: V(46, 68),
  heightMeters: 0.9,
};

export const downToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(192, 300),
  dimensions: V(46, 68),
  heightMeters: 0.9,
};

export const rightToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(240, 300),
  dimensions: V(48, 68),
  heightMeters: 1,
};

export const leftToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(288, 300),
  dimensions: V(48, 68),
  heightMeters: 1,
};

export const downSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(0, 376),
  dimensions: V(47, 68),
  heightMeters: 0.6,
};

export const downSink2: DecorationSprite = {
  imageName: bathroom,
  offset: V(48, 376),
  dimensions: V(47, 68),
  heightMeters: 0.6,
};

export const rightSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 372),
  dimensions: V(48, 68),
  heightMeters: 0.8,
};

export const leftSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(144, 372),
  dimensions: V(48, 68),
  heightMeters: 0.8,
};
