import img_sink1 from "../../../../resources/images/environment/bathroom/sink-1.png";
import img_sink3 from "../../../../resources/images/environment/bathroom/sink-3.png";
import img_sinkGroup1 from "../../../../resources/images/environment/bathroom/sink-group-1.png";
import img_sinkGroup2 from "../../../../resources/images/environment/bathroom/sink-group-2.png";
import img_sinkGroup3 from "../../../../resources/images/environment/bathroom/sink-group-3.png";
import img_sinkGroup4 from "../../../../resources/images/environment/bathroom/sink-group-4.png";
import img_sinkGroup5 from "../../../../resources/images/environment/bathroom/sink-group-5.png";
import img_sinkGroup6 from "../../../../resources/images/environment/bathroom/sink-group-6.png";
import img_sink2 from "../../../../resources/images/environment/bathroom/sink2.png";
import img_toilet1 from "../../../../resources/images/environment/bathroom/toilet-1.png";
import img_toilet2 from "../../../../resources/images/environment/bathroom/toilet-2.png";
import img_toilet3 from "../../../../resources/images/environment/bathroom/toilet-3.png";
import img_toilet4 from "../../../../resources/images/environment/bathroom/toilet-4.png";
import img_toilet5 from "../../../../resources/images/environment/bathroom/toilet-5.png";
import { DecorationInfo } from "./DecorationInfo";

export const toilet1: DecorationInfo = {
  imageName: img_toilet1,
  heightMeters: 0.92,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const toilet2: DecorationInfo = {
  ...toilet1,
  imageName: img_toilet2,
};

export const toilet3: DecorationInfo = {
  ...toilet1,
  imageName: img_toilet3,
};

export const toilet4: DecorationInfo = {
  ...toilet1,
  imageName: img_toilet4,
};

export const toilet5: DecorationInfo = {
  ...toilet1,
  imageName: img_toilet5,
};

export const sink1: DecorationInfo = {
  imageName: img_sink1,
  heightMeters: 0.58,
  isSolid: true,
};

export const sink2: DecorationInfo = {
  imageName: img_sink2,
  heightMeters: 0.5,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const sink3: DecorationInfo = {
  imageName: img_sink3,
  heightMeters: 0.5,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const sinkGroup1: DecorationInfo = {
  imageName: img_sinkGroup1,
  heightMeters: 0.82,
  isSolid: true,
};

export const sinkGroup2: DecorationInfo = {
  ...sinkGroup1,
  imageName: img_sinkGroup2,
};

export const sinkGroup3: DecorationInfo = {
  ...sinkGroup1,
  imageName: img_sinkGroup3,
};

export const sinkGroup4: DecorationInfo = {
  ...sinkGroup1,
  imageName: img_sinkGroup4,
};

export const sinkGroup5: DecorationInfo = {
  ...sinkGroup1,
  imageName: img_sinkGroup5,
};

export const sinkGroup6: DecorationInfo = {
  ...sinkGroup1,
  imageName: img_sinkGroup6,
};
