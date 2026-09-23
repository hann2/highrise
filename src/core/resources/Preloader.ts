import * as Pixi from "pixi.js";
import { SoundName } from "../../../resources/resources";
import { on } from "../entity/handler";
import Game from "../Game";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { getBiggestSounds, getTotalSoundBytes, loadSound } from "./sounds";

export type ResourceManifest = {
  images: { [name: string]: string };
  sounds: { [name: string]: string };
  fonts: { [name: string]: string };
};

const MAX_SOUNDS_LOADING_AT_ONCE = 16;

export interface PreloaderProgress {
  fonts: { loaded: number; total: number };
  images: { loaded: number; total: number };
  sounds: { loaded: number; total: number };
}

/**
 * An asset preloader that loads images, sounds, and fonts with progress
 * tracking. Calls `onProgress` whenever something finishes loading so that a
 * loading screen can be updated, and resolves when all assets are ready.
 *
 * Fonts load first, on their own, so that a loading screen can be drawn in the
 * game's fonts while images and sounds load together.
 */
export default class Preloader extends BaseEntity implements Entity {
  private _resolve!: () => void;
  private _promise!: Promise<void>;

  readonly progress: PreloaderProgress = {
    fonts: {
      loaded: 0,
      total: 0,
    },
    images: {
      loaded: 0,
      total: 0,
    },
    sounds: {
      loaded: 0,
      total: 0,
    },
  };

  constructor(
    private manifest: ResourceManifest,
    private onProgress?: (progress: PreloaderProgress) => void,
  ) {
    super();

    this._promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  @on("add")
  async onAdd({ game }: { game: Game }) {
    await this.loadFonts();
    await Promise.all([this.loadImages(), this.loadSounds(game.audio)]);
    const bytes = getTotalSoundBytes();

    console.groupCollapsed(
      `Audio Loaded: ${(bytes / 2 ** 20).toFixed(1)}MB total`,
    );

    getBiggestSounds()
      .slice(0, 5)
      .forEach(([url, size]) =>
        console.info(url, "\n", `${(size / 1024).toFixed(1)}kB`),
      );

    console.groupEnd();
    this._resolve();
  }

  waitTillLoaded() {
    return this._promise;
  }

  async loadFonts() {
    this.progress.fonts.total = Object.values(this.manifest.fonts).length;
    this.progress.fonts.loaded = 0;

    try {
      await Promise.all(
        Object.entries(this.manifest.fonts).map(async ([name, src]) => {
          const fontFace = new FontFace(name, `url(${src})`);
          document.fonts.add(await fontFace.load());
          this.progress.fonts.loaded += 1;
          this.onProgress?.(this.progress);
        }),
      );
    } catch (e) {
      console.error("Fonts failed to load", e);
    }
  }

  async loadSounds(audioContext: AudioContext) {
    this.progress.sounds.loaded = 0;
    this.progress.sounds.total = Object.values(this.manifest.sounds).length;

    // Requesting every sound at once fills the browser's request queue, and
    // images, which are requested after, wait until the last sound is in. A
    // few at a time leaves room for images to load alongside.
    const queue = Object.entries(this.manifest.sounds);
    const loadNext = async (): Promise<void> => {
      const next = queue.shift();
      if (!next) {
        return;
      }
      const [name, url] = next;
      try {
        await loadSound(name as SoundName, url, audioContext);
      } catch (e) {
        console.warn(`Sound failed to load: ${url}`, e);
      }
      this.progress.sounds.loaded += 1;
      this.onProgress?.(this.progress);
      return loadNext();
    };
    await Promise.all(
      Array.from({ length: MAX_SOUNDS_LOADING_AT_ONCE }, () => loadNext()),
    );
  }

  async loadImages() {
    this.progress.images.loaded = 0;
    this.progress.images.total = Object.values(this.manifest.images).length;

    Pixi.Assets.addBundle("images", this.manifest.images);

    try {
      const textures = await Pixi.Assets.loadBundle(
        "images",
        (progressPercent) => {
          this.progress.images.loaded = Math.round(
            progressPercent * this.progress.images.total,
          );
          this.onProgress?.(this.progress);
        },
      );
      // World textures are usually drawn smaller than their pixel size, and
      // without mipmaps fine patterns (carpet, tile grout) alias into moiré
      // that crawls as the camera moves. This has to be set before a texture
      // is first uploaded to the GPU, which happens on first render.
      for (const texture of Object.values(textures)) {
        if (texture instanceof Pixi.Texture) {
          texture.source.autoGenerateMipmaps = true;
        }
      }
    } catch (e) {
      console.error("Images failed to load", e);
    }
  }
}
