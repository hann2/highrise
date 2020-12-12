import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";
import MainMenu from "./MainMenu";

const SCROLL_SPEED = 0.8;
const TEXT_SIZE = 20;
const HEADING_SIZE = 32;
const LINE_SPACING = 8;
export default class CreditsScreen extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.MENU;

    const lines = TEXT.split("\n");
    let nextHeight = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const isHeading = line[0] === "#";
      if (isHeading) {
        line = line.substring(1);
      }
      const fontSize = isHeading ? HEADING_SIZE : TEXT_SIZE;
      const textSprite = new Text(line, {
        fontSize,
        fontFamily: "Comfortaa",
        fill: "white",
        align: "center",
        fontWeight: isHeading ? "700" : "300",
      });
      textSprite.y = nextHeight;
      nextHeight += fontSize + LINE_SPACING;
      textSprite.anchor.set(0.5);
      this.sprite.addChild(textSprite);
    }
  }

  handlers = {
    resize: () => this.centerText(),
  };

  onAdd(game: Game) {
    this.centerText();
    this.sprite.y = game.renderer.getHeight();
  }

  centerText() {
    this.sprite.x = this.game!.renderer.getWidth() / 2;
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "Escape":
        this.backToMenu();
    }
  }

  backToMenu() {
    this.game?.addEntity(new MainMenu());
    this.destroy();
  }

  onRender() {
    let speed = SCROLL_SPEED;
    if (this.game!.io.keyIsDown("Space")) {
      speed *= 10;
    }
    this.sprite!.y -= speed;

    if (this.sprite.getBounds().bottom < 0) {
      this.backToMenu();
    }
  }
}

const TEXT = `
#DESIGN
Philip Hann
Simon Baumgardt-Wellander


#PROGRAMMING
Philip Hann
Simon Baumgardt-Wellander


#VOICE ACTORS
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


#MUSIC
Michael Wiktorek
Simon Baumgardt-Wellander


#SOUND EFFECTS
Simon Baumgardt-Wellander
Morgan Thurlow
 With thanks to
Fesliyan Studios - Guns
The Free Firearm Sound Library — Guns


#ART
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
