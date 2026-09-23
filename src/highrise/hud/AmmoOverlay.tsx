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

/** Pixels between the right edge of the screen and the shells, to make room for the reserve count */
const RESERVE_WIDTH = 64;

/**
 * Bottom right of the screen: the rounds in the gun as shells (Pixi), the
 * reserve next to them, and above them the other slot's weapon and the
 * consumables carried (HTML).
 */
export class AmmoOverlay extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  sprite: Container & GameSprite;
  bulletSpriteContainer: Container;
  private lastWeapon: Weapon | undefined = undefined;
  private lastCapacity = 0;

  constructor(public getHuman: () => Human) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.HUD;

    this.bulletSpriteContainer = new Container();
    this.sprite.addChild(this.bulletSpriteContainer);

    this.addChild(new ReactEntity(() => this.renderText()));
  }

  renderText() {
    const human = this.getHuman();
    if (human.isDestroyed) {
      return null;
    }
    const weapon = human.weapon;
    const gamepad = this.game.io.usingGamepad;

    let reserveText: string | undefined;
    let warning: string | undefined;
    if (weapon instanceof Gun) {
      const reserve = human.getReserve(weapon.stats.ammoClass);
      reserveText = reserve === Infinity ? "∞" : String(reserve);
      if (weapon.ammo == 0) {
        warning =
          reserve > 0 ? `Press ${gamepad ? "X" : "R"} To Reload` : "No Ammo";
      }
    }

    const other = human.otherWeapon;
    const consumable = human.consumable;

    return (
      <>
        <div className="hud-inventory">
          {consumable && human.consumableCount > 0 && (
            <div className="hud-inventory__row">
              <span className="hud-key">{gamepad ? "LB" : "G"}</span>
              {consumable.name} ×{human.consumableCount}
            </div>
          )}
          {other && (
            <div className="hud-inventory__row hud-inventory__other">
              <span className="hud-key">{gamepad ? "Y" : "Q"}</span>
              {other.stats.name}
              {other instanceof Gun &&
                ` ${other.ammo}/${formatReserve(human.getReserve(other.stats.ammoClass))}`}
            </div>
          )}
        </div>
        {reserveText !== undefined && (
          <div
            className={
              "hud-reserve" + (reserveText === "0" ? " hud-reserve--empty" : "")
            }
          >
            {reserveText}
          </div>
        )}
        {warning && (
          <div
            className="hud-reload-text"
            style={{ right: `${RESERVE_WIDTH + 10}px` }}
          >
            {warning}
          </div>
        )}
      </>
    );
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    this.bulletSpriteContainer.position.set(
      width - 10 - RESERVE_WIDTH,
      height - 10,
    );
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
      const loaded = Math.min(weapon.ammo, capacity);
      for (let i = 0; i < loaded; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.9;
      }

      for (let i = loaded; i < capacity; i++) {
        this.bulletSpriteContainer.getChildAt(i).alpha = 0.3;
      }
    }
  }
}

function formatReserve(reserve: number): string {
  return reserve === Infinity ? "∞" : String(reserve);
}
