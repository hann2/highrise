import { Container, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import ReactEntity from "../../core/ReactEntity";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import { Weapon } from "../weapons/weapons";
import "./hud.css";

export class AmmoOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  bulletSpriteContainer: Container;
  private lastWeapon: Weapon | undefined = undefined;
  private lastCapacity = 0;
  private needsReload = false;

  constructor(public getHuman: () => Human) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;

    this.bulletSpriteContainer = new Container();
    this.sprite.addChild(this.bulletSpriteContainer);

    // The text is drawn over the (dimmed) bullets when the gun is empty
    this.addChild(new ReactEntity(() => this.renderReloadText()));
  }

  renderReloadText() {
    if (!this.needsReload) {
      return null;
    }
    const reloadButton = this.game.io.usingGamepad ? "X" : "R";
    return (
      <div className="hud-reload-text">Press {reloadButton} To Reload</div>
    );
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    this.bulletSpriteContainer.position.set(width - 10, height - 10);
  }

  setWeapon(weapon: Weapon | undefined, capacity: number) {
    this.lastWeapon = weapon;
    this.lastCapacity = capacity;

    this.bulletSpriteContainer.removeChildren();

    if (weapon instanceof Gun) {
      const numBullets = capacity;
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
    const human = this.getHuman();
    const weapon = human.weapon;
    // Upgrades can change the magazine size of the gun in hand
    const capacity = weapon instanceof Gun ? weapon.getCapacity(human) : 0;

    if (weapon != this.lastWeapon || capacity != this.lastCapacity) {
      this.setWeapon(weapon, capacity);
    }

    if (weapon instanceof Gun) {
      this.needsReload = weapon.ammo == 0;

      const loaded = Math.min(weapon.ammo, capacity);
      for (let i = 0; i < loaded; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.9;
      }

      for (let i = loaded; i < capacity; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.3;
      }
    } else {
      this.needsReload = false;
    }
  }
}
