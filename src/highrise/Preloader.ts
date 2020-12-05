import * as Pixi from "pixi.js";
import dsDigitalUrl from "../../resources/fonts/ds-digi.ttf";
import bathroom from "../../resources/images/bathroom.png";
import healthPack from "../../resources/images/health_pack.png";
import pointLight from "../../resources/images/lights/point-light.png";
import market from "../../resources/images/market.png";
import muzzleFlash1 from "../../resources/images/muzzle_flashs/muzzle-flash-1.png";
import muzzleFlash10 from "../../resources/images/muzzle_flashs/muzzle-flash-10.png";
import muzzleFlash11 from "../../resources/images/muzzle_flashs/muzzle-flash-11.png";
import muzzleFlash12 from "../../resources/images/muzzle_flashs/muzzle-flash-12.png";
import muzzleFlash13 from "../../resources/images/muzzle_flashs/muzzle-flash-13.png";
import muzzleFlash14 from "../../resources/images/muzzle_flashs/muzzle-flash-14.png";
import muzzleFlash15 from "../../resources/images/muzzle_flashs/muzzle-flash-15.png";
import muzzleFlash16 from "../../resources/images/muzzle_flashs/muzzle-flash-16.png";
import muzzleFlash2 from "../../resources/images/muzzle_flashs/muzzle-flash-2.png";
import muzzleFlash3 from "../../resources/images/muzzle_flashs/muzzle-flash-3.png";
import muzzleFlash4 from "../../resources/images/muzzle_flashs/muzzle-flash-4.png";
import muzzleFlash5 from "../../resources/images/muzzle_flashs/muzzle-flash-5.png";
import muzzleFlash6 from "../../resources/images/muzzle_flashs/muzzle-flash-6.png";
import muzzleFlash7 from "../../resources/images/muzzle_flashs/muzzle-flash-7.png";
import muzzleFlash8 from "../../resources/images/muzzle_flashs/muzzle-flash-8.png";
import muzzleFlash9 from "../../resources/images/muzzle_flashs/muzzle-flash-9.png";
import axe from "../../resources/images/weapons/axe.png";
import katana from "../../resources/images/weapons/katana.png";
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
      axe,
      bathroom,
      healthPack,
      katana,
      market,
      muzzleFlash1,
      muzzleFlash10,
      muzzleFlash11,
      muzzleFlash12,
      muzzleFlash13,
      muzzleFlash14,
      muzzleFlash15,
      muzzleFlash16,
      muzzleFlash2,
      muzzleFlash3,
      muzzleFlash4,
      muzzleFlash5,
      muzzleFlash6,
      muzzleFlash7,
      muzzleFlash8,
      muzzleFlash9,
      pointLight,
      zoimbie1Hold,
      zoimbie1Stand,
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
