import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import type { AtlasPage, AtlasSlot } from "./LightAtlas";
import LightingManager from "./LightingManager";

/**
 * A light. The `LightingManager` draws every light in view each frame, all
 * together: each gets a square of `size` meters in the light atlas, where its
 * `lightSprite` is drawn and then the shadowed part erased with its square of
 * the shadow mask atlas (if it casts shadows), and that square is then added
 * onto the screen with the light's brightness and color.
 */
export default class Light extends BaseEntity implements Entity {
  private lightManager?: LightingManager;
  /** Adds the light's square of the light atlas onto the screen */
  readonly compositeSprite: Sprite;
  /** Erases the shadowed part of the light in the light atlas */
  readonly maskSprite: Sprite;
  /** Holds `lightSprite` where the light's square of the light atlas is */
  readonly container = new Container();
  /** Disabled lights aren't drawn */
  public enabled: boolean = true;
  /** Width and height of the square around the light that it lights, in meters */
  public size: number;
  /** Where the light is in the atlas this frame, if it's in view */
  slot?: AtlasSlot;

  constructor(
    /** What the light looks like (its brightness and color get applied to it); any display object, centered on the light */
    public lightSprite: Container = new Container(),
    public shadowsEnabled: boolean = false,
    /** Half of the default size */
    radius: number = 1,
    /** Radius of the light source in meters; bigger means softer shadows, 0 means hard */
    public sourceRadius: number = 0,
    size: number = radius * 2,
  ) {
    super();
    this.size = size;
    this.container.addChild(lightSprite);

    this.compositeSprite = new Sprite(new Texture({ frame: new Rectangle() }));
    this.compositeSprite.anchor.set(0.5, 0.5);
    this.compositeSprite.blendMode = "add";
    this.maskSprite = new Sprite(new Texture({ frame: new Rectangle() }));
    this.maskSprite.anchor.set(0.5, 0.5);
    // Erases the blocked fraction of the light
    this.maskSprite.blendMode = "erase";
  }

  @on("add")
  onAdd() {
    this.lightManager = this.game.entities.getSingleton(LightingManager);
    this.lightManager.addLight(this);
  }

  @on("destroy")
  onDestroy() {
    this.lightManager!.removeLight(this);
    this.lightManager = undefined;
    // These aren't registered with the renderer as entity sprites, so nothing
    // else cleans them up
    this.compositeSprite.destroy({ texture: true });
    this.maskSprite.destroy({ texture: true });
    this.container.destroy({ children: true });
  }

  /** Where the light is, in world coordinates */
  get x(): number {
    return this.compositeSprite.position.x;
  }
  get y(): number {
    return this.compositeSprite.position.y;
  }

  /** Set the width and height of the square it lights, in meters. */
  setSize(size: number) {
    this.size = size;
  }

  /** Whether there's anything to draw: enabled and not at zero brightness */
  get isLit(): boolean {
    return this.enabled && this.compositeSprite.alpha > 0;
  }

  /**
   * Puts the light's sprites where its slot in the atlas is: the light drawn
   * in the middle of it, the mask and the composite reading from it
   */
  placeInAtlas(slot: AtlasSlot, page: AtlasPage) {
    this.slot = slot;
    this.container.position.set(slot.x, slot.y);
    this.maskSprite.position.set(slot.x, slot.y);
    viewSlot(this.maskSprite, page.mask.source, slot, this.size);
    viewSlot(this.compositeSprite, page.light.source, slot, this.size);
  }

  enableShadows() {
    this.shadowsEnabled = true;
  }

  disableShadows() {
    this.shadowsEnabled = false;
  }

  setPosition([x, y]: [number, number]) {
    this.compositeSprite.position.set(x, y);
  }

  /** How bright the light is */
  setIntensity(value: number) {
    this.compositeSprite.alpha = value;
  }

  /** The light's color */
  setColor(value: number) {
    this.compositeSprite.tint = value;
  }

  setSourceRadius(value: number) {
    this.sourceRadius = value;
  }
}

/** Points `sprite`'s texture at the square of `size` meters in the middle of `slot` */
function viewSlot(
  sprite: Sprite,
  source: Texture["source"],
  slot: AtlasSlot,
  size: number,
) {
  const texture = sprite.texture;
  if (texture.source !== source) {
    texture.source = source;
  }
  const half = size / 2;
  texture.frame.x = slot.x - half;
  texture.frame.y = slot.y - half;
  texture.frame.width = texture.orig.width = size;
  texture.frame.height = texture.orig.height = size;
  texture.update();
}
