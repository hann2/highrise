import img_transformer from "../../../../resources/images/environment/maintenance/transformer.png";
import Entity from "../../../core/entity/Entity";
import { choose } from "../../../core/util/Random";
import { V } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import { SparkGenerator } from "../../environment/lighting/SparkGenerator";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { CellTransformer } from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class LightSwitchRoomTemplate extends RoomTemplate {
  constructor(public floor: DecorationInfo) {
    super(
      V(3, 3),
      [
        [V(1, -1), false],
        [V(1, 2), false],
      ],
      floor
    );
  }

  generateEntities(transformCell: CellTransformer): Entity[] {
    const entities: Entity[] = [];
    entities.push(
      new Decoration(transformCell(V(1, 1)), {
        imageName: img_transformer,
        heightMeters: 2,
        isSolid: true,
        rotation: choose(...CARDINAL_DIRECTIONS_VALUES).angle,
      })
    );
    entities.push(new SparkGenerator(transformCell(V(1, 1))));
    return entities;
  }
}
