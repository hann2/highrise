import { DecorationInfo } from "./DecorationInfo";

export const toilet1: DecorationInfo = {
  imageName: "toilet1",
  heightMeters: 0.92,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const toilet2: DecorationInfo = {
  ...toilet1,
  imageName: "toilet2",
};

export const toilet3: DecorationInfo = {
  ...toilet1,
  imageName: "toilet3",
};

export const toilet4: DecorationInfo = {
  ...toilet1,
  imageName: "toilet4",
};

export const toilet5: DecorationInfo = {
  ...toilet1,
  imageName: "toilet5",
};

export const sink1: DecorationInfo = {
  imageName: "sink1",
  heightMeters: 0.58,
  isSolid: true,
};

export const sink2: DecorationInfo = {
  imageName: "sink2",
  heightMeters: 0.5,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const sink3: DecorationInfo = {
  imageName: "sink3",
  heightMeters: 0.5,
  isSolid: true,
  bodyInset: [0.1, 0.1],
};

export const sinkGroup1: DecorationInfo = {
  imageName: "sinkGroup1",
  heightMeters: 0.82,
  isSolid: true,
};

export const sinkGroup2: DecorationInfo = {
  ...sinkGroup1,
  imageName: "sinkGroup2",
};

export const sinkGroup3: DecorationInfo = {
  ...sinkGroup1,
  imageName: "sinkGroup3",
};

export const sinkGroup4: DecorationInfo = {
  ...sinkGroup1,
  imageName: "sinkGroup4",
};

export const sinkGroup5: DecorationInfo = {
  ...sinkGroup1,
  imageName: "sinkGroup5",
};

export const sinkGroup6: DecorationInfo = {
  ...sinkGroup1,
  imageName: "sinkGroup6",
};
