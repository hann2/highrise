import img_transformer from "../../../../resources/images/environment/maintenance/transformer.png";
import { choose } from "../../../core/util/Random";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { DecorationInfo } from "./DecorationInfo";

export const transformer: DecorationInfo = {
  imageName: img_transformer,
  heightMeters: 2,
  isSolid: true,
};
