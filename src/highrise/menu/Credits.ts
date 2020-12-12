import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";
import MainMenu from "./MainMenu";

const SCROLL_SPEED = 0.8;
const NAME_SIZE = 20;
const LABEL_SIZE = 14;
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
      const parts = line.split("—");

      if (parts.length == 2) {
        const leftTextSprite = new Text(parts[0], {
          fontSize: LABEL_SIZE,
          fontFamily: "Comfortaa",
          fill: "white",
          align: "right",
          fontWeight: isHeading ? "700" : "300",
        });
        const rightTextSprite = new Text(parts[1], {
          fontSize: NAME_SIZE,
          fontFamily: "Comfortaa",
          fill: "white",
          align: "left",
          fontWeight: isHeading ? "700" : "300",
        });
        leftTextSprite.y = nextHeight;
        rightTextSprite.y = nextHeight;
        leftTextSprite.x = -2;
        rightTextSprite.x = 2;
        nextHeight += NAME_SIZE + LINE_SPACING;
        leftTextSprite.anchor.set(1, 0.5);
        rightTextSprite.anchor.set(0, 0.5);
        this.sprite.addChild(leftTextSprite);
        this.sprite.addChild(rightTextSprite);
      } else if (parts.length == 1) {
        const fontSize = isHeading ? HEADING_SIZE : NAME_SIZE;
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
Andy—Andy Moreland
Chad, Demitri, Shadowlord66—Michael Wiktorek
Cindy—Lawlfrats
Clarice, Kyle—Marisa DeNicolo-Hann
Clyde—Philip Hann
Dusty Rusty—@ICREATENOVELTY
Lucky Jack—Cole Graham
Simon—Simon Baumgardt-Wellander
Takeshi—Rory Jackson
Wendy—Wendy Vang


#MUSIC
Michael Wiktorek
Simon Baumgardt-Wellander


#SOUND EFFECTS
Simon Baumgardt-Wellander
Morgan Thurlow

With thanks to
Gun Sounds—Fesliyan Studios
 —The Free Firearm Sound Library


#ART
Philip Hann
Simon Baumgardt-Wellander

With thanks to:
Humans and Zombies—Kenny NL
Blood Splatters—PWL
Gun Sprites—Project Cordon Sprites
Environment Sprites—Panda Maru 
 —Nicnubill
 —Ayene Chan


No zombies were harmed in the making of this game.
Some celery, walnuts, potatoes, and a lemon were though.
`;
