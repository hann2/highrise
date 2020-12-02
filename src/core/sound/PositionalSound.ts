import Entity from "../entity/Entity";
import Game from "../Game";
import { SoundName } from "../resources/sounds";
import { clamp } from "../util/MathUtil";
import { V, V2d } from "../Vector";
import { SoundInstance, SoundOptions } from "./SoundInstance";

const FALL_OFF = 0.025; // dB / meter or something
const MAX_SPREAD = 0.95; // maximum pan (0-1)
const SPREAD_DISTANCE = 10; // meters

/**
 * Represents a currently playing sound.
 */
export class PositionalSound extends SoundInstance implements Entity {
  private _distanceGain: number = 1.0;
  private distanceGainNode!: GainNode;
  private listenerPosition: V2d = V(0, 0);

  set distanceGain(value: number) {
    if (!this.game) {
      this._distanceGain = value;
    } else {
      this.distanceGainNode.gain.value = value;
    }
  }

  constructor(
    soundName: SoundName,
    private position: V2d = V(0, 0),
    options: SoundOptions = {}
  ) {
    super(soundName, options);
    this.tags.push("positional_sound");
    this.setPosition(position);
  }

  makeChain(game: Game) {
    const mainGain = super.makeChain.call(this, game);
    this.distanceGainNode = game.audio.createGain();
    this.distanceGainNode.gain.value = this._distanceGain;
    mainGain.connect(this.distanceGainNode);
    return this.distanceGainNode;
  }

  setPosition(position: V2d) {
    if (isNaN(position[0]) || isNaN(position[1])) {
      throw new Error(`invalid position: ${position}`);
    }
    this.position.set(position);
    this.updateStuff();
  }

  setListenerPosition(position: V2d) {
    this.listenerPosition.set(position);
    this.updateStuff();
  }

  updateStuff() {
    const relativePosition = this.position.sub(this.listenerPosition);
    const distance = relativePosition.magnitude;
    const theta = relativePosition.angle;
    this.pan =
      Math.cos(theta) * MAX_SPREAD * clamp(distance / SPREAD_DISTANCE) ** 2;
    const gain = 1.0 / (1.0 + distance * FALL_OFF);
    this.distanceGain = gain;
  }
}
