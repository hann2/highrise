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
  offset: V(48, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const leftToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const downToilet1: DecorationSprite = {
  imageName: bathroom,
  offset: V(144, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const downToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(192, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const rightToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(240, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const leftToilet2: DecorationSprite = {
  imageName: bathroom,
  offset: V(288, 304),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const downSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(0, 370),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const downSink2: DecorationSprite = {
  imageName: bathroom,
  offset: V(48, 370),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const rightSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(96, 370),
  dimensions: V(48, 64),
  heightMeters: 1,
};

export const leftSink1: DecorationSprite = {
  imageName: bathroom,
  offset: V(144, 370),
  dimensions: V(48, 64),
  heightMeters: 1,
};
