import snd_pianoHit1 from "../../../../resources/audio/impacts/piano-hit-1.flac";
import snd_pianoHit2 from "../../../../resources/audio/impacts/piano-hit-2.flac";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import WallImpact from "../../effects/WallImpact";
import Bullet from "../../projectiles/Bullet";
import SwingingWeapon from "../../weapons/melee/SwingingWeapon";
import Decoration from "../Decoration";
import { piano } from "../decorations/decorations";
import Hittable from "../Hittable";

export const PIANO_HIT_SOUNDS = [snd_pianoHit1, snd_pianoHit2];

export class Piano extends Decoration {
  constructor(position: V2d, angle: number = 0) {
    super(position, piano, angle, Layer.FURNITURE);

    this.decorationBody!.onBulletHit = (
      bullet: Bullet,
      position: V2d,
      normal: V2d
    ) => {
      const sound = choose(...PIANO_HIT_SOUNDS);
      this.game?.addEntity(new PositionalSound(sound, position));
      this.game?.addEntity(new WallImpact(position, normal, 0x000000));

      return true;
    };

    this.decorationBody!.onMeleeHit = (
      swingingWeapon: SwingingWeapon,
      position: V2d
    ): void => {
      this.game?.addEntity(
        new PositionalSound(choose(...PIANO_HIT_SOUNDS), position)
      );
    };
  }
}
