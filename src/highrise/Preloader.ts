import * as Pixi from "pixi.js";
import dsDigitalUrl from "../../resources/fonts/ds-digi.ttf";
import captureItUrl from "../../resources/fonts/capture_it/capture_it.ttf";
import bathroom from "../../resources/images/environment/bathroom.png";
import fancyFurniture from "../../resources/images/environment/fancy-furniture.png";
import fencesLights from "../../resources/images/environment/fences-lights.png";
import furniture from "../../resources/images/environment/furniture.png";
import market from "../../resources/images/environment/market.png";
import healthPack from "../../resources/images/health_pack.png";
import pointLight from "../../resources/images/lights/point-light.png";
import zoimbie1Hold from "../../resources/images/Zombie 1/zoimbie1_hold.png";
import zoimbie1Stand from "../../resources/images/Zombie 1/zoimbie1_stand.png";
import BaseEntity from "../core/entity/BaseEntity";
import Entity from "../core/entity/Entity";
import Game from "../core/Game";
import { loadSound, SoundName, SOUND_URLS } from "../core/resources/sounds";
import { CHARACTERS } from "./characters/characters";
import { MUZZLE_FLASH_URLS } from "./effects/MuzzleFlash";
import { GUNS } from "./entities/guns/Guns";
import { MELEE_WEAPONS } from "./entities/meleeWeapons/MeleeWeapons";

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
    const fonts = [
      new FontFace("DS Digital", `url(${dsDigitalUrl})`),
      new FontFace("Capture It", `url(${captureItUrl})`),
    ];
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
    const imageUrls = new Set([
      fencesLights,
      bathroom,
      fancyFurniture,
      furniture,
      healthPack,
      market,
      pointLight,
      zoimbie1Hold,
      zoimbie1Stand,
      ...MUZZLE_FLASH_URLS,
    ]);

    for (const character of CHARACTERS) {
      imageUrls.add(character.imageGun);
      imageUrls.add(character.imageStand);
      imageUrls.add(character.imageReload);
      imageUrls.add(character.imageHold);
    }

    for (const GunConstructor of GUNS) {
      const stats = new GunConstructor().stats;
      stats.pickupTexture && imageUrls.add(stats.pickupTexture);
    }

    for (const MeleeWeaponConstructor of MELEE_WEAPONS) {
      const weapon = new MeleeWeaponConstructor();
      const { pickupTexture, attackTexture, holdTexture } = weapon.stats;
      attackTexture && imageUrls.add(attackTexture);
      holdTexture && imageUrls.add(holdTexture);
      pickupTexture && imageUrls.add(pickupTexture);
    }

    let loaded = 0;
    const total = imageUrls.size;
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
