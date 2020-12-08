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


  PROGRAMMING
Philip Hann
Simon Baumgardt-Wellander


  VOICE ACTORS
Philip Hann — Clyde
Simon Baumgardt-Wellander — Simon
Marisa DeNicolo-Hann — Clarice, Kyle
Michael Wiktorek — Chad, Demitri, Shadowlord66
Lawlfrats — Cindy
Andy Moreland — Andy
Wendy Vang — Wendy
Cole Graham — Lucky Jack


  MUSIC
Michael Wiktorek
Simon Baumgardt-Wellander


  SOUND EFFECTS
Simon Baumgardt-Wellander
Morgan Thurlow
 With thanks to
Fesliyan Studios - Guns
The Free Firearm Sound Library — Guns


  ART
Philip Hann
Simon Baumgardt-Wellander
  With thanks to:
Kenny NL - Humans and Zombies
PWL - Blood Splatters
Project Cordon Sprites - Guns
Panda Maru - Environment
Nicnubill - Environment
Ayene Chan - Environment


No zombies were harmed in the making of this game.
Some celery, walnuts, potatoes, and a lemon were though.
`;
