import { Container, Sprite } from "pixi.js";
import { RESOURCES } from "../../../resources/resources";
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
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { Weapon, WeaponSlot } from "../weapons/weapons";

const WEAPON_SLOTS: WeaponSlot[] = ["primary", "secondary"];
import "./hud.css";

/** Pixels between the right edge of the screen and the shells, to make room for the reserve count */
const RESERVE_WIDTH = 64;

/**
 * Bottom right of the screen: the rounds in the gun as shells (Pixi), the
 * reserve next to them, and above them both weapon slots (the one in hand
 * highlighted) and the consumables carried (HTML).
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

    const consumable = human.consumable;

    return (
      <>
        <div className="hud-inventory">
          {consumable && human.consumableCount > 0 && (
            <div className="hud-item hud-item--consumable">
              <span className="hud-key">{gamepad ? "LB" : "G"}</span>
              <div className="hud-item__icon">
                <ConsumableIcon stats={consumable} />
              </div>
              <div className="hud-item__text">
                <div className="hud-item__name">{consumable.name}</div>
                <div className="hud-item__count">×{human.consumableCount}</div>
              </div>
            </div>
          )}
          {WEAPON_SLOTS.map((slot) => (
            <WeaponCard
              key={slot}
              human={human}
              slot={slot}
              swapKey={gamepad ? "Y" : "Q"}
            />
          ))}
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

/** One weapon slot: what's in it, its ammo, and whether it's in hand */
function WeaponCard({
  human,
  slot,
  swapKey,
}: {
  human: Human;
  slot: WeaponSlot;
  swapKey: string;
}) {
  const weapon = human.getWeaponInSlot(slot);
  const active = slot === human.activeSlot;
  const classes = [
    "hud-item",
    "hud-weapon",
    active ? "hud-weapon--active" : "",
    weapon ? "" : "hud-weapon--empty",
  ];
  if (!weapon) {
    return (
      <div className={classes.join(" ")}>
        <div className="hud-item__text">
          <div className="hud-item__name">No {slot}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={classes.join(" ")}>
      <span
        className="hud-key"
        style={{
          visibility: !active && human.otherWeapon ? "visible" : "hidden",
        }}
      >
        {swapKey}
      </span>
      <div className="hud-item__icon">
        <img
          src={RESOURCES.images[weapon.stats.textures.pickup]}
          // Melee weapons are drawn pointing up; guns point right
          className={
            weapon instanceof MeleeWeapon ? "hud-item__img--rotated" : ""
          }
        />
      </div>
      <div className="hud-item__text">
        <div className="hud-item__name">{weapon.stats.name}</div>
        {weapon instanceof Gun && (
          <div className="hud-item__count">
            {weapon.ammo} /{" "}
            {formatReserve(human.getReserve(weapon.stats.ammoClass))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Same shape as `drawConsumable`, as an SVG */
function ConsumableIcon({ stats }: { stats: ConsumableStats }) {
  const [length, width] = stats.size;
  const pad = width * 0.4;
  return (
    <svg
      viewBox={`${-length / 2 - pad} ${-width / 2 - pad} ${length + pad * 2} ${width + pad * 2}`}
    >
      <rect
        x={-length / 2}
        y={-width / 2}
        width={length}
        height={width}
        rx={width / 2}
        fill={cssColor(stats.color)}
        stroke="rgba(0, 0, 0, 0.6)"
        stroke-width={width * 0.06}
      />
      <rect
        x={length / 2 - width * 0.35}
        y={-width * 0.3}
        width={width * 0.35}
        height={width * 0.6}
        fill={cssColor(stats.accentColor)}
      />
      <circle
        cx={length / 2 + width * 0.1}
        cy={width * 0.35}
        r={width * 0.18}
        fill="none"
        stroke={cssColor(stats.accentColor)}
        stroke-width={width * 0.07}
      />
    </svg>
  );
}

function cssColor(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

function formatReserve(reserve: number): string {
  return reserve === Infinity ? "∞" : String(reserve);
}
