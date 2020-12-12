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
@ICREATENOVELTY — Cowboy
Andy Moreland — Andy
Cole Graham — Lucky Jack
Lawlfrats — Cindy
Marisa DeNicolo-Hann — Clarice, Kyle
Michael Wiktorek — Chad, Demitri, Shadowlord66
Philip Hann — Clyde
Rory Jackson — Takeshi
Simon Baumgardt-Wellander — Simon
Wendy Vang — Wendy

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
