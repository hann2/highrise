import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";

export default class Credits extends BaseEntity implements Entity {
  constructor() {
    super();

    this.sprite = new Sprite();
  }
}

const TEXT = `
  DESIGN
Philip Hann
Simon Baumgardt-Wellander

  SOUND EFFECTS
Simon Baumgardt-Wellander
Fesliyan Studios

  VOICE ACTORS
Philip Hann
Simon Baumgardt-Wellander
Marisa DeNicolo-Hann
Lawlfrats

  ART
Philip Hann
Simon Baumgardt-Wellander
Kenny NL
Project Cordon Sprites
Panda Maru
`;
