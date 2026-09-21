import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const lobbyDesk: DecorationInfo = {
  imageName: "lobbyDesk1",
  heightMeters: 1.3,
  isSolid: true,
  bodyInset: [0.35, 0.35],
};

export const lamp: DecorationInfo = {
  imageName: "fancyFurniture",
  sheetInfo: { offset: V(300, 0), dimensions: V(26, 48) },
  heightMeters: 0.2,
};

export const coffeeTable: DecorationInfo = {
  imageName: "furniture",
  sheetInfo: { offset: V(352, 160), dimensions: V(32, 64) },
  heightMeters: 2,
};

export const column: DecorationInfo = {
  imageName: "fancyFurniture",
  sheetInfo: { offset: V(338, 48), dimensions: V(46, 144) },
  heightMeters: 8,
};

export const rug: DecorationInfo = {
  imageName: "fancyRug1",
  heightMeters: 3.3,
};

export const fancyChair1: DecorationInfo = {
  imageName: "fancyChair1",
  heightMeters: 1.2,
  isSolid: true,
  bodyInset: [0.4, 0.4],
};

export const fancyCoffeeTable1: DecorationInfo = {
  imageName: "fancyTable1",
  heightMeters: 2,
  isSolid: true,
  bodyInset: [0.02, 0.02],
};

export const fancyCoffeeTable2: DecorationInfo = {
  imageName: "fancyTable2",
  heightMeters: 2,
  isSolid: true,
  bodyInset: [0.02, 0.02],
};

export const piano: DecorationInfo = {
  imageName: "piano",
  heightMeters: 3,
  isSolid: true,
  isHittable: true,
  bodyInset: [0.6, 0.6],

  corners: [
    [-1, -0.6],
    [-0.5, -1],
    [-0.3, -0.9],
    [0.1, -0.7],
    [0.2, -0.4],
    [1, -0.2],
    [1, 0.6],
    [0.6, 0.6],
    [0.6, 1],
    [-0.6, 1],
    [-0.6, 0.6],
    [-1, 0.6],
  ],

  hitSounds: ["pianoHit1", "pianoHit2"],
};

export const endTable1: DecorationInfo = {
  imageName: "fancyEndTable1",
  heightMeters: 0.8,
  isSolid: true,
};

export const endTable2: DecorationInfo = {
  imageName: "fancyEndTable2",
  heightMeters: 0.8,
  isSolid: true,
};
