import { SoundName } from "../../../resources/resources";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { on } from "../entity/handler";
import Game from "../Game";
import { getSoundBuffer, hasSoundBuffer } from "../resources/sounds";
import { clamp } from "../util/MathUtil";
import { rUniform } from "../util/Random";

export interface SoundOptions {
  pan?: number;
  gain?: number;
  speed?: number;
  continuous?: boolean;
  randomStart?: boolean;
  /** Seconds into the sound to start playing from */
  offset?: number;
  /** Seconds of the sound to play (from `offset`), else to its end */
  duration?: number;
  reactToSlowMo?: boolean;
  persistenceLevel?: number;
  pauseable?: boolean;
  outnode?: () => AudioNode;
}

/**
 * Represents a currently playing sound.
 */
export class SoundInstance extends BaseEntity implements Entity {
  tags = ["sound"];
  public readonly continuous: boolean;
  public reactToSlowMo: boolean;

  private sourceNode!: AudioBufferSourceNode;
  private panNode!: StereoPannerNode;
  public gainNode!: GainNode;
  private _speed: number = 1.0;

  private elapsed: number = 0;
  private lastTick: number = 0;

  private paused: boolean = false;

  set speed(value: number) {
    this._speed = value;
    this.updatePlaybackRate();
  }

  get speed(): number {
    return this._speed;
  }

  set pan(value: number) {
    if (!this.isAdded) {
      this.options.pan = value;
    } else {
      this.panNode.pan.value = value;
    }
  }

  get pan(): number {
    if (!this.isAdded) {
      return this.options.pan ?? 0;
    } else {
      return this.panNode.pan.value;
    }
  }

  set gain(value: number) {
    if (!this.isAdded) {
      this.options.gain = value;
    } else {
      this.gainNode.gain.value = value;
    }
  }

  get gain(): number {
    if (!this.isAdded) {
      return this.options.gain ?? 1;
    } else {
      return this.gainNode.gain.value;
    }
  }

  private _promise: Promise<void>;
  private _resolve!: () => void;

  constructor(
    public readonly soundName: SoundName,
    private options: SoundOptions = {},
  ) {
    super();
    this.speed = options.speed ?? 1.0;
    this.continuous = options.continuous ?? false;
    this.reactToSlowMo = options.reactToSlowMo ?? true;
    this.persistenceLevel = options.persistenceLevel ?? 0;
    this.pausable = options.pauseable ?? true;

    if (!hasSoundBuffer(soundName)) {
      throw new Error(`Unloaded Sound ${soundName}`);
    }

    this._promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    const chain = this.makeChain(game);
    if (this.options.outnode) {
      chain.connect(this.options.outnode());
    } else {
      chain.connect(game.masterGain);
    }

    this.lastTick = game.audio.currentTime;

    const offset = this.options.randomStart
      ? rUniform(0, this.sourceNode.buffer!.duration * 0.99)
      : (this.options.offset ?? 0);
    this.startSource(offset);
  }

  /** Where in the buffer this sound stops (unless it's continuous) */
  private get endTime(): number {
    const { duration, offset = 0 } = this.options;
    const bufferDuration = this.sourceNode.buffer!.duration;
    return duration !== undefined
      ? Math.min(offset + duration, bufferDuration)
      : bufferDuration;
  }

  /** Starts the source node playing from `offset` seconds into the buffer */
  private startSource(offset: number) {
    this.elapsed = offset;
    this.sourceNode.onended = () => {
      if (!this.paused) {
        this.destroy();
      }
    };
    if (this.continuous) {
      this.sourceNode.start(0, offset);
    } else {
      this.sourceNode.start(0, offset, Math.max(0, this.endTime - offset));
    }
  }

  /** Creates the  */
  makeChain({ audio, slowMo }: Game): AudioNode {
    this.sourceNode = audio.createBufferSource();
    this.sourceNode.buffer = getSoundBuffer(this.soundName)!;
    this.sourceNode.loop = this.continuous;
    if (this.reactToSlowMo) {
      this.sourceNode.playbackRate.value = this._speed * slowMo;
    } else {
      this.sourceNode.playbackRate.value = this._speed;
    }

    this.panNode = audio.createStereoPanner();
    this.panNode.pan.value = this.options.pan ?? 0.0;

    this.gainNode = audio.createGain();
    this.gainNode.gain.value = this.options.gain ?? 1.0;

    this.sourceNode.connect(this.panNode);
    this.panNode.connect(this.gainNode);
    return this.gainNode;
  }

  async waitTillEnded() {
    if (this.continuous) {
      throw new Error("Can't wait for end of continuous sound");
    }
    return this._promise;
  }

  @on("tick")
  onTick() {
    const now = this.game.audio.currentTime;
    this.elapsed += (now - this.lastTick) * this.sourceNode.playbackRate.value;
    if (this.continuous) {
      this.elapsed = this.elapsed % this.sourceNode.buffer!.duration;
    }
    this.lastTick = now;
  }

  updatePlaybackRate() {
    if (this.sourceNode && this.isAdded) {
      if (this.reactToSlowMo) {
        this.sourceNode.playbackRate.value = this._speed * this.game.slowMo;
      } else {
        this.sourceNode.playbackRate.value = this._speed;
      }
    }
  }

  @on("slowMoChanged")
  onSlowMoChanged() {
    this.updatePlaybackRate();
  }

  pause() {
    if (this.pausable) {
      this.paused = true;
      this.sourceNode.onended = null;
      this.sourceNode.stop();
    }
  }

  unpause() {
    if (this.paused) {
      this.paused = false;
      const bufferDuration = this.sourceNode.buffer!.duration;
      if (!this.continuous && this.elapsed >= this.endTime) {
        this.destroy();
      } else {
        this.restartSound(this.elapsed % bufferDuration);
      }
    }
  }

  restartSound(startTime: number) {
    this.sourceNode.onended = null;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    const newNode = this.game.audio.createBufferSource();
    newNode.buffer = this.sourceNode.buffer;
    newNode.loop = this.sourceNode.loop;
    newNode.playbackRate.value = this.sourceNode.playbackRate.value;
    this.sourceNode = newNode;
    this.sourceNode.connect(this.panNode);
    this.startSource(clamp(startTime, 0, this.sourceNode.buffer!.duration));
  }

  jumpToRandom() {
    this.restartSound(rUniform(0, this.sourceNode.buffer!.duration * 0.99));
  }

  @on("pause")
  onPause() {
    this.pause();
  }

  @on("unpause")
  onUnpause() {
    this.unpause();
  }

  @on("destroy")
  onDestroy() {
    this.sourceNode.stop();
    this._resolve();
  }
}
