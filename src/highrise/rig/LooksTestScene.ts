import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { makeRandom } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { slug } from "../arena/arenaConfig";
import { CHARACTERS } from "../characters/Character";
import { HUMAN_RADIUS, Persistence } from "../constants/constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import { HUMAN_GAIT, ZOMBIE_GAIT } from "../creature-stuff/Legs";
import { ZOMBIE_LOOKS } from "../enemies/zombie/ZombieVariants";
import { cementFloor } from "../environment/decorations/floorDecorations";
import RepeatingFloor from "../environment/RepeatingFloor";
import { BOB_LOOK } from "../lobby/ReceptionistBob";
import { BodyLook } from "../looks/BodyLook";
import { bakeBodies, getAppearance } from "../looks/bakeBodies";
import { randomLook } from "../looks/randomLook";

/** Meters between bodies in the grid */
const SPACING = 1.25;
/** Each walks round a circle this big (meters), this fast (m/s) */
const CIRCLE = 0.32;
const WALK_SPEED = 0.9;

/**
 * `?scene=looks` (development only): every character and every zombie look,
 * in a grid, walking round little circles so their legs move. For looking at
 * the body generator's art in the game (`npm run clip -- --scene looks`).
 *
 * `only=andy,santa` picks characters (`only=` for none), `zombies=` how many
 * zombie looks (all of them by default), `random=N` adds N new random
 * zombies (`seed=` for others), `people=N` random living people, `still`
 * stands them still, `zoom=` sets the camera.
 */
export default class LooksTestScene extends BaseEntity implements Entity {
  id = "looksTestScene";
  persistenceLevel = Persistence.Permanent;
  cycles = 0;
  private params = new URLSearchParams(window.location.search);

  @on("add")
  async onAdd() {
    const params = this.params;
    const only = params.get("only");
    const characters = (
      only === null
        ? CHARACTERS
        : CHARACTERS.filter((c) =>
            only.split(",").map(slug).includes(slug(c.name)),
          )
    ).map((c) => ({ look: c.look, zombie: false }));
    const zombieCount = Number(params.get("zombies") ?? ZOMBIE_LOOKS.length);
    const random = makeRandom(Number(params.get("seed") ?? 7));
    const extra: BodyLook[] = [
      ...Array.from({ length: Number(params.get("random") ?? 0) }, () =>
        randomLook(random, true),
      ),
      ...Array.from({ length: Number(params.get("people") ?? 0) }, () =>
        randomLook(random, false),
      ),
    ];
    await bakeBodies(extra);
    const bodies = [
      ...characters,
      ...ZOMBIE_LOOKS.slice(0, zombieCount).map((look) => ({
        look,
        zombie: true,
      })),
      ...extra.map((look) => ({ look, zombie: !!look.zombie })),
      ...(only === null ? [{ look: BOB_LOOK, zombie: true }] : []),
    ];

    const view = this.game.renderer.getSize();
    const aspect = view[0] / view[1];
    const columns = Math.max(1, Math.ceil(Math.sqrt(bodies.length * aspect)));
    const rows = Math.ceil(bodies.length / columns);
    const width = columns * SPACING;
    const height = rows * SPACING;
    const zoom =
      Number(params.get("zoom")) ||
      Math.min(view[0] / width, view[1] / height) * 0.95;
    const roomWidth = Math.max(width, view[0] / zoom) + 2;
    const roomHeight = Math.max(height, view[1] / zoom) + 2;
    const offset = V((roomWidth - width) / 2, (roomHeight - height) / 2);

    this.addChild(new RepeatingFloor(cementFloor, [0, 0], [roomWidth, roomHeight]));
    this.game.camera.z = zoom;
    this.game.camera.center(V(roomWidth / 2, roomHeight / 2));

    const still = params.has("still");
    bodies.forEach(({ look, zombie }, i) => {
      const center = offset.add(
        V(
          (i % columns) * SPACING + SPACING / 2,
          Math.floor(i / columns) * SPACING + SPACING / 2,
        ),
      );
      this.addChild(new Mannequin(look, center, zombie, still, i));
    });
    this.cycles = 1;
  }
}

/** A body on its own, walking round a little circle */
class Mannequin extends BodySprite {
  private position: V2d;
  private angle = -Math.PI / 2;
  private phase: number;

  constructor(
    look: BodyLook,
    private center: V2d,
    private zombie: boolean,
    private still: boolean,
    index: number,
  ) {
    const appearance = getAppearance(look);
    super(appearance.standing, HUMAN_RADIUS, {
      colors: appearance.legColors,
      gait: zombie ? ZOMBIE_GAIT : HUMAN_GAIT,
    });
    this.phase = index * 0.7;
    this.position = center.clone();
  }

  @on("tick")
  onTick(dt: number) {
    if (this.still) {
      return;
    }
    this.phase += (dt * WALK_SPEED) / CIRCLE;
    this.position.set(
      this.center.x + Math.cos(this.phase) * CIRCLE,
      this.center.y + Math.sin(this.phase) * CIRCLE,
    );
    this.angle = this.phase + Math.PI / 2;
  }

  getPosition() {
    return this.position;
  }

  getAngle() {
    return this.angle;
  }

  getHandPositions(): [V2d, V2d] {
    const [left, right] = this.getShoulderPositions();
    if (this.zombie) {
      return [left.iadd(V(0.32, 0.05)), right.iadd(V(0.32, -0.05))];
    }
    const swing = this.still ? 0 : Math.sin(this.phase * 3) * 0.08;
    return [left.iadd(V(0.08 + swing, 0.04)), right.iadd(V(0.08 - swing, -0.04))];
  }
}
