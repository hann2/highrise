import { RESOURCES, SoundName } from "../../../resources/resources";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerAxis, ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { Persistence } from "../constants/constants";
import { getPartyManager } from "../environment/PartyManager";
import type Human from "../human/Human";
import type { Item } from "../items/Item";
import { giveItem, markItemSeen, timesTaken } from "../items/items";
import { itemPrice } from "../items/prices";
import { Shelf } from "../items/shelf";
import { consumableImageUrl } from "../weapons/consumables/consumableImage";
import "./menu.css";

// How far the stick has to go to move the selection, and how far back it has
// to come before it can move it again
const STICK_PRESS = 0.6;
const STICK_RELEASE = 0.3;
// Seconds before input counts, so the E that opened it doesn't also close it
const INPUT_DELAY = 0.3;
// Seconds a bought item wiggles in its coil, then falls to the tray
export const WIGGLE_TIME = 0.6;
export const DROP_TIME = 0.35;
// Seconds the display says why it didn't sell something
const MESSAGE_TIME = 1.5;

/**
 * The store's vending machine, seen from the front: the quarters on an LED
 * display, a 2×2 of items (4×2 in a big store), and a bottom row with a gun
 * and a consumable. Slots are numbered row by row, then the gun and the
 * consumable. Buying
 * something makes it wiggle and drop, and then it's yours; the slot is empty
 * for the rest of the floor. The game is paused while it's up.
 */
export default class StoreScreen extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Floor;
  pausable = false;

  selected = 0;
  /** A bought item on its way down, and when it was bought (game time) */
  private vending?: { index: number; item: Item; startedAt: number };
  /** What the display says instead of the quarters, and until when */
  private message?: { text: string; until: number };
  private shownAt = 0;
  private done = false;
  private stickHeld = false;

  constructor(
    readonly shelf: Shelf,
    /** Who buys and pays */
    readonly human: Human,
  ) {
    super(() => this.renderContent());
  }

  /** Where the gun and the consumable are in the numbering, after the items */
  get gunIndex(): number {
    return this.shelf.slots.length;
  }
  get consumableIndex(): number {
    return this.shelf.slots.length + 1;
  }
  get slotCount(): number {
    return this.shelf.slots.length + 2;
  }
  /** Columns of items: two, or four in a big store */
  get columns(): number {
    return this.shelf.slots.length > 4 ? 4 : 2;
  }

  /** What's in slot `index` now (null once it's sold) */
  itemAt(index: number): Item | null {
    if (index === this.gunIndex) {
      return this.shelf.gun;
    } else if (index === this.consumableIndex) {
      return this.shelf.consumable;
    }
    return this.shelf.slots[index] ?? null;
  }

  private emptySlot(index: number) {
    if (index === this.gunIndex) {
      this.shelf.gun = null;
    } else if (index === this.consumableIndex) {
      this.shelf.consumable = null;
    } else {
      this.shelf.slots[index] = null;
    }
  }

  get quarters(): number {
    return getPartyManager(this.game)?.quarters ?? 0;
  }

  /** What the LED display shows right now */
  get displayText(): string {
    if (this.message && this.game.elapsedTime < this.message.until) {
      return this.message.text;
    }
    return this.vending ? "VENDING" : `${this.quarters} QUARTERS`;
  }

  renderContent() {
    const usingGamepad = this.game.io.usingGamepad;
    const buyButton = usingGamepad ? "A" : "Enter";
    const closeButton = usingGamepad ? "B" : "Esc";
    const selectedItem = this.itemAt(this.selected);
    const flashing =
      this.message !== undefined && this.game.elapsedTime < this.message.until;
    return (
      <div className="menu-screen store">
        <div
          className={`store__machine ${this.columns > 2 ? "store__machine--big" : ""}`}
        >
          <div
            className={`store__display ${flashing ? "store__display--message" : ""}`}
          >
            {this.displayText}
          </div>
          <div className="store__window">
            <div
              className="store__grid"
              style={{ gridTemplateColumns: `repeat(${this.columns}, 1fr)` }}
            >
              {this.shelf.slots.map((_, i) => this.renderSlot(i))}
            </div>
            <div className="store__grid">
              {this.renderSlot(this.gunIndex)}
              {this.renderSlot(this.consumableIndex)}
            </div>
          </div>
          <div className="store__label">
            {selectedItem ? selectedItem.description : "Sold out"}
          </div>
          <div className="store__tray" />
        </div>
        <div className="store__hint">
          {buyButton} to buy · {closeButton} to close
        </div>
      </div>
    );
  }

  private renderSlot(index: number) {
    const item = this.itemAt(index);
    const classes = [
      "store__slot",
      index === this.selected ? "store__slot--selected" : "",
    ];
    const events = {
      onMouseEnter: () => this.select(index),
      onClick: () => {
        this.select(index);
        this.buy();
      },
    };
    if (!item) {
      classes.push("store__slot--empty");
      return (
        <div key={index} className={classes.join(" ")} {...events}>
          <div className="store__sold-out">Sold out</div>
        </div>
      );
    }
    classes.push(`store__slot--${item.rarity}`);
    if (this.vending?.index === index) {
      classes.push("store__slot--vending");
    }
    const kind =
      index === this.gunIndex
        ? `${item.rarity} gun`
        : index === this.consumableIndex
          ? "throwable"
          : item.rarity;
    const image = item.weapon
      ? RESOURCES.images[item.weapon.textures.pickup]
      : item.consumable
        ? consumableImageUrl(item.consumable)
        : undefined;
    const owned = this.ownedText(item);
    return (
      <div key={index} className={classes.join(" ")} {...events}>
        <div className="store__rarity">{kind}</div>
        {image && <img className="store__image" src={image} />}
        <div className="store__name">{item.name}</div>
        {owned && <div className="store__owned">{owned}</div>}
        <div className="store__price">
          <span className="store__coin" />
          {itemPrice(item)}
        </div>
      </div>
    );
  }

  /** "Own 2 / 3" for an item the human already has some of */
  private ownedText(item: Item): string | undefined {
    const taken = timesTaken(this.human, item);
    if (taken === 0) {
      return undefined;
    }
    return item.maxStacks === undefined
      ? `Own ${taken}`
      : `Own ${taken} / ${item.maxStacks}`;
  }

  @on("add")
  onAdd(data: { game: Game }) {
    super.onAdd(data);
    this.shownAt = data.game.elapsedTime;
    data.game.pause();
    // Seeing it on the shelf is enough for the encyclopedia
    for (let i = 0; i < this.slotCount; i++) {
      const item = this.itemAt(i);
      if (item) {
        markItemSeen(item);
      }
    }
    // Start on something that's for sale
    const firstForSale = [...Array(this.slotCount).keys()].find((i) =>
      this.itemAt(i),
    );
    this.selected = firstForSale ?? 0;
  }

  private get tooSoon(): boolean {
    return this.game.elapsedTime - this.shownAt < INPUT_DELAY;
  }

  select(index: number) {
    if (!this.done && !this.vending) {
      this.selected = (index + this.slotCount) % this.slotCount;
    }
  }

  /**
   * Moves the selection around the grid, wrapping at the edges. The bottom
   * row's two slots each cover half the columns.
   */
  move(dx: number, dy: number) {
    const columns = this.columns;
    const itemRows = this.shelf.slots.length / columns;
    const half = columns / 2;
    // The row and (leftmost) column of what's selected
    const bottom = this.selected >= this.gunIndex;
    let row = bottom ? itemRows : Math.floor(this.selected / columns);
    let column = bottom
      ? (this.selected - this.gunIndex) * half
      : this.selected % columns;
    row = (row + dy + itemRows + 1) % (itemRows + 1);
    column = (column + dx * (row === itemRows ? half : 1) + columns) % columns;
    this.select(
      row === itemRows
        ? this.gunIndex + Math.floor(column / half)
        : row * columns + column,
    );
  }

  /** Buys what's selected, if it's there and the party can pay for it */
  buy() {
    if (this.done || this.vending || this.tooSoon) {
      return;
    }
    const item = this.itemAt(this.selected);
    if (!item) {
      this.playSound("vendingMachineHit1", 0.3, 0.8);
      return;
    }
    if (!getPartyManager(this.game)?.spendQuarters(itemPrice(item))) {
      this.message = {
        text: "INSUFFICIENT FUNDS",
        until: this.game.elapsedTime + MESSAGE_TIME,
      };
      this.playSound("vendingMachineHit1", 0.4, 0.8);
      return;
    }
    this.message = undefined;
    this.vending = {
      index: this.selected,
      item,
      startedAt: this.game.elapsedTime,
    };
    this.playSound("quarterDrop1", 1, 1.05);
  }

  // Timers don't run while the game is paused, so the vending is timed here.
  // The left stick moves the selection once per push.
  @on("tick")
  onTick() {
    if (
      this.vending &&
      this.game.elapsedTime - this.vending.startedAt >= WIGGLE_TIME + DROP_TIME
    ) {
      const { index, item } = this.vending;
      this.vending = undefined;
      this.emptySlot(index);
      this.playSound("vendingMachineHit2", 0.5, 0.6);
      if (!this.human.isDestroyed) {
        giveItem(this.human, item);
      }
    }

    const io = this.game.io;
    if (!io.usingGamepad) {
      return;
    }
    const x = io.getAxis(ControllerAxis.LEFT_X);
    const y = io.getAxis(ControllerAxis.LEFT_Y);
    if (this.stickHeld) {
      if (Math.abs(x) < STICK_RELEASE && Math.abs(y) < STICK_RELEASE) {
        this.stickHeld = false;
      }
    } else if (Math.max(Math.abs(x), Math.abs(y)) >= STICK_PRESS) {
      this.stickHeld = true;
      if (Math.abs(x) > Math.abs(y)) {
        this.move(Math.sign(x), 0);
      } else {
        this.move(0, Math.sign(y));
      }
    }
  }

  close() {
    if (this.done || this.vending || this.tooSoon) {
      return;
    }
    this.done = true;
    this.game.unpause();
    this.destroy();
  }

  /** A sound that plays while the game is paused */
  private playSound(name: SoundName, gain: number, speed: number) {
    this.game.addEntity(
      new SoundInstance(name, { gain, speed, pauseable: false }),
    );
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "ArrowLeft":
      case "KeyA":
        return this.move(-1, 0);
      case "ArrowRight":
      case "KeyD":
        return this.move(1, 0);
      case "ArrowUp":
      case "KeyW":
        return this.move(0, -1);
      case "ArrowDown":
      case "KeyS":
        return this.move(0, 1);
      case "Enter":
      case "Space":
        return this.buy();
      case "Escape":
      case "KeyE":
        return this.close();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    switch (button) {
      case ControllerButton.D_LEFT:
        return this.move(-1, 0);
      case ControllerButton.D_RIGHT:
        return this.move(1, 0);
      case ControllerButton.D_UP:
        return this.move(0, -1);
      case ControllerButton.D_DOWN:
        return this.move(0, 1);
      case ControllerButton.A:
        return this.buy();
      case ControllerButton.B:
      case ControllerButton.START:
        return this.close();
    }
  }
}

/** Whether a store is up (and owns the pause) */
export function isStoreOpen(game: Game): boolean {
  return game.entities
    .getByConstructor(StoreScreen)
    .some((screen) => !screen.isDestroyed);
}
