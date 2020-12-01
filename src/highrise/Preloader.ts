import * as Pixi from "pixi.js";
import dsDigitalUrl from "../../resources/fonts/ds-digi.ttf";
import manBlueGun from "../../resources/images/Man Blue/manBlue_gun.png";
import manBrownGun from "../../resources/images/Man Brown/manBrown_gun.png";
import manOldGun from "../../resources/images/Man Old/manOld_gun.png";
import zoimbie1Hold from "../../resources/images/Zombie 1/zoimbie1_hold.png";
import zoimbie1Stand from "../../resources/images/Zombie 1/zoimbie1_stand.png";
import BaseEntity from "../core/entity/BaseEntity";
import Entity from "../core/entity/Entity";
import Game from "../core/Game";
import { loadSound, SoundName, SOUND_URLS } from "../core/resources/sounds";

export default class Preloader extends BaseEntity implements Entity {
  private _resolve!: () => void;
  private _promise!: Promise<void>;

  constructor() {
    super();

    this._promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  async onAdd(game: Game) {
    await Promise.all([
      this.loadFonts(),
      this.loadSounds(game.audio),
      this.loadImages(),
    ]);
    this._resolve();
  }

  waitTillLoaded() {
    return this._promise;
  }

  async loadFonts() {
    const fonts = [new FontFace("DS Digital", `url(${dsDigitalUrl})`)];
    let loaded = 0;
    const total = fonts.length;
    const element = document.getElementById("font-count")!;
    element.innerText = `${loaded} / ${total}`;

    await Promise.all(
      fonts.map(async (font) => {
        document.fonts.add(await font.load());
        loaded += 1;
        element.innerText = `${loaded} / ${total}`;
      })
    );
  }

  async loadSounds(audioContext: AudioContext) {
    const soundNames = Object.keys(SOUND_URLS) as SoundName[];
    let loaded = 0;
    const total = soundNames.length;
    const element = document.getElementById("sound-count")!;
    element.innerText = `${loaded} / ${total}`;

    await Promise.all(
      soundNames.map(async (name) => {
        const url = SOUND_URLS[name];
        try {
          await loadSound(name as SoundName, url, audioContext);
        } catch (e) {
          console.warn(`Sound failed to load: ${name}, ${url}`, e);
        }
        loaded += 1;
        element.innerText = `${loaded} / ${total}`;
      })
    );
  }

  async loadImages() {
    const imageUrls = [
      manBlueGun,
      manBrownGun,
      manOldGun,
      zoimbie1Hold,
      zoimbie1Stand,
      "asdfasdfasdf",
    ];
    let loaded = 0;
    const total = imageUrls.length;
    const element = document.getElementById("image-count")!;
    element.innerText = `${loaded} / ${total}`;

    const loader = Pixi.Loader.shared;
    for (const imageUrl of imageUrls) {
      loader.add(imageUrl);
    }

    loader.onProgress.add((_) => {
      loaded += 1;
      element.innerText = `${loaded} / ${total}`;
    });
    loader.onError.add((_, image) => {
      console.warn(`Image failed to load ${image}`);
    });
    const completePromise = new Promise<void>((resolve) =>
      loader.onComplete.add(() => resolve())
    );

    loader.load();

    await completePromise;
  }

  onDestroy() {
    document.getElementById("preloader")?.remove();
  }
}
