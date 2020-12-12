import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";
import MainMenu from "./MainMenu";

const SCROLL_SPEED = 1.0;
const TEXT_SIZE = 22;
const LINE_HEIGHT = 32;
export default class CreditsScreen extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.MENU;

    const lines = TEXT.split("\n");
    console.log(lines);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const textSprite = new Text(line, {
        fontSize: 24,
        fill: "white",
        align: "left",
      });
      textSprite.y = i * 30;
      this.sprite.addChild(textSprite);
    }
  }

  onAdd(game: Game) {
    this.sprite.x = 30;
    this.sprite.y = game.renderer.getHeight();
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "Escape":
        this.game?.addEntity(new MainMenu());
        this.destroy();
    }
  }

  onRender() {
    this.sprite!.y -= SCROLL_SPEED;
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
