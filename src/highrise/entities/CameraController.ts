import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { Camera2d } from "../../core/graphics/Camera2d";
import Human from "./Human";

export default class CameraController extends BaseEntity implements Entity {
  constructor(private camera: Camera2d, private player: Human) {
    super();
  }

  onRender() {
    this.camera.z = 25;
    this.camera.smoothCenter(this.player.getPosition());
  }
}
