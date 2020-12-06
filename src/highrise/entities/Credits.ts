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

  MUSIC
Michael Wiktorek
Simon Baumgardt-Wellander

  SOUND EFFECTS
Simon Baumgardt-Wellander
 With thanks to
  Fesliyan Studios - Guns


  VOICE ACTORS
Philip Hann
Simon Baumgardt-Wellander
Philip Hann
Marisa DeNicolo-Hann
Michael Wiktorek
Lawlfrats
Andy Moreland
Wendy Vang

  ART
Philip Hann
Simon Baumgardt-Wellander
 With thanks to
  Kenny NL - Humans and Zombies
  Project Cordon Sprites - Guns
  Panda Maru - Environment
`;
