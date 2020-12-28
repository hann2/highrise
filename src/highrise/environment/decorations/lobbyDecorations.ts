import snd_pianoHit1 from "../../../../resources/audio/impacts/piano-hit-1.flac";
import snd_pianoHit2 from "../../../../resources/audio/impacts/piano-hit-2.flac";
import img_fancyFurniture from "../../../../resources/images/environment/fancy-furniture.png";
import img_fancyRug1 from "../../../../resources/images/environment/fancy-rug-1.png";
import img_furniture from "../../../../resources/images/environment/furniture.png";
import img_fancyChair1 from "../../../../resources/images/environment/furniture/fancy-chair-1.png";
import img_fancyEndTable1 from "../../../../resources/images/environment/furniture/fancy-end-table-1.png";
import img_fancyEndTable2 from "../../../../resources/images/environment/furniture/fancy-end-table-2.png";
import img_fancyTable1 from "../../../../resources/images/environment/furniture/fancy-table-1.png";
import img_fancyTable2 from "../../../../resources/images/environment/furniture/fancy-table-2.png";
import img_lobbyDesk1 from "../../../../resources/images/environment/furniture/lobby-desk-1.png";
import img_piano from "../../../../resources/images/environment/furniture/piano.png";
import { V } from "../../../core/Vector";
import { DecorationInfo } from "./DecorationInfo";

export const lobbyDesk: DecorationInfo = {
  imageName: img_lobbyDesk1,
  heightMeters: 1.3,
  isSolid: true,
  bodyInset: [0.35, 0.35],
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
  imageName: img_fancyRug1,
  heightMeters: 3.3,
};

export const fancyChair1: DecorationInfo = {
  imageName: img_fancyChair1,
  heightMeters: 1.2,
  isSolid: true,
  bodyInset: [0.4, 0.4],
};

export const fancyCoffeeTable1: DecorationInfo = {
  imageName: img_fancyTable1,
  heightMeters: 2,
  isSolid: true,
  bodyInset: [0.02, 0.02],
};

export const fancyCoffeeTable2: DecorationInfo = {
  imageName: img_fancyTable2,
  heightMeters: 2,
  isSolid: true,
  bodyInset: [0.02, 0.02],
};

export const piano: DecorationInfo = {
  imageName: img_piano,
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

  hitSounds: [snd_pianoHit1, snd_pianoHit2],
};

export const endTable1: DecorationInfo = {
  imageName: img_fancyEndTable1,
  heightMeters: 0.8,
  isSolid: true,
};

export const endTable2: DecorationInfo = {
  imageName: img_fancyEndTable2,
  heightMeters: 0.8,
  isSolid: true,
};
