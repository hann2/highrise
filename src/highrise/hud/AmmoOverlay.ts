import { Container, Sprite, Text } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { fontName } from "../../core/resources/resourceUtils";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import { Weapon } from "../weapons/weapons";

export class AmmoOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  reloadText: Text;
  bulletSpriteContainer: Container;
  private lastWeapon: Weapon | undefined = undefined;

  constructor(public getHuman: () => Human) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;

    this.reloadText = new Text({
      text: "Press R To Reload",
      style: {
        align: "right",
        fill: "red",
        fontFamily: fontName("comfortaa"),
        fontSize: 16,
      },
    });
    this.reloadText.anchor.set(1, 1);
    this.sprite.addChild(this.reloadText);

    this.bulletSpriteContainer = new Container();
    this.sprite.addChild(this.bulletSpriteContainer);
  }

  @on("inputDeviceChange")
  onInputDeviceChange({ usingGamepad }: { usingGamepad: boolean }) {
    if (usingGamepad) {
      this.reloadText.text = "Press X To Reload";
    } else {
      this.reloadText.text = "Press R To Reload";
    }
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    this.reloadText.position.set(width - 10, height - 10);
    this.bulletSpriteContainer.position.set(width - 10, height - 10);
  }

  setWeapon(weapon: Weapon | undefined) {
    this.lastWeapon = weapon;

    this.bulletSpriteContainer.removeChildren();

    if (weapon instanceof Gun) {
      const numBullets = weapon.stats.ammoCapacity;
      const spacing = 5 + 10 / numBullets;
      for (let i = 0; i < numBullets; i++) {
        const bulletSprite = Sprite.from(weapon.stats.textures.shellCasing);
        bulletSprite.scale.set(0.75);
        bulletSprite.anchor.set(1, 1);
        bulletSprite.x = -i * spacing;
        this.bulletSpriteContainer.addChild(bulletSprite);
      }
    }
  }

  @on("render")
  onRender() {
    const weapon = this.getHuman().weapon;

    if (weapon != this.lastWeapon) {
      this.setWeapon(weapon);
    }

    if (weapon instanceof Gun) {
      this.reloadText.visible = weapon.ammo == 0;

      for (let i = 0; i < weapon.ammo; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.9;
      }

      for (let i = weapon.ammo; i < weapon.stats.ammoCapacity; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.3;
      }
    } else {
      this.reloadText.visible = false;
    }
  }
}
