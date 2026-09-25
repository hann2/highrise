/**
 * Reads and writes the character data (`src/highrise/characters/data/`) and
 * the clips' audio files for the character editor. Every change is checked
 * with `characterDataProblems` before it's written, so the editor can't save
 * data the game would refuse.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { globSync } from "glob";
import prettier from "prettier";
import { resourceName } from "../../src/core/resources/resourceName";
import {
  CharacterData,
  CharacterDataContext,
  characterDataProblems,
  CharacterSoundClass,
  VoiceClip,
} from "../../src/highrise/characters/CharacterData";
import { GUNS } from "../../src/highrise/weapons/guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "../../src/highrise/weapons/melee/melee-weapons/meleeWeapons";
import {
  CharacterChanges,
  ClipChanges,
  GenerateRequest,
} from "../../src/tools/character-editor/apiTypes";

export type { CharacterChanges, ClipChanges, GenerateRequest };

/** What makes new clips' audio; the real one is in `elevenLabs.ts` */
export interface SpeechGenerator {
  generate(request: {
    text: string;
    voiceId: string;
    model: string;
    stability?: number;
  }): Promise<{ audio: Buffer; extension: string }>;
  transcribe(file: string): Promise<string>;
}

const CHARACTER_FIELDS = [
  "name",
  "description",
  "textures",
  "stats",
  "startingWeapons",
  "voice",
] as const;

/** Writes a cleaned-up copy of an audio file (see `audioProcessing.ts`) */
export type AudioCleanUp = (input: string, output: string) => Promise<unknown>;

export const GENERATION_MODEL = "eleven_v3";

/** How clip file names start, after the character's id, by their first category */
const FILE_STEMS: Record<CharacterSoundClass, string> = {
  joinParty: "join-party",
  newLevel: "new-level",
  misc: "misc",
  lookHere: "look-here",
  pickupGun: "pickup-gun",
  pickupMelee: "pickup-melee",
  pickupHealth: "pickup-health",
  pickupItem: "pickup-item",
  taunts: "taunt",
  worried: "worried",
  hurt: "hurt",
  nearDeath: "near-death",
  death: "death",
  relief: "relief",
};

const IMAGE_EXTENSIONS = ["bmp", "gif", "jpg", "png", "svg"];
const SOUND_EXTENSIONS = ["flac", "mp3", "ogg", "wav"];

export class CharacterStore {
  readonly dataDir: string;
  private queue: Promise<unknown> = Promise.resolve();

  private regenerateManifest: () => Promise<void>;
  private cleanUpAudio: AudioCleanUp;

  constructor(
    readonly root: string,
    private speech: SpeechGenerator,
    options: {
      /** Called after clip files are added to or removed from resources/ */
      regenerateManifest?: () => Promise<void>;
      /** Trims and levels audio; copies it unchanged by default */
      cleanUpAudio?: AudioCleanUp;
    } = {},
  ) {
    this.dataDir = path.join(root, "src/highrise/characters/data");
    this.regenerateManifest = options.regenerateManifest ?? (async () => {});
    this.cleanUpAudio =
      options.cleanUpAudio ??
      (async (input, output) => fs.copyFileSync(input, output));
  }

  /** Folder of a character's enabled (shipped) or disabled clips */
  audioDir(id: string, enabled: boolean): string {
    return enabled
      ? path.join(this.root, "resources/audio/characters", id)
      : path.join(this.root, "assets/source/voices", id);
  }

  ids(): string[] {
    return fs
      .readdirSync(this.dataDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"))
      .sort();
  }

  read(id: string): CharacterData {
    if (!this.ids().includes(id)) {
      throw new NotFound(`No character "${id}"`);
    }
    return JSON.parse(
      fs.readFileSync(path.join(this.dataDir, `${id}.json`), "utf8"),
    );
  }

  /** Where a clip's audio is now, or undefined if it has no file */
  clipPath(id: string, file: string): string | undefined {
    if (file.includes("/") || file.includes("\\")) {
      return undefined;
    }
    return [true, false]
      .map((enabled) => path.join(this.audioDir(id, enabled), file))
      .find((filePath) => fs.existsSync(filePath));
  }

  /** What exists on disk for character data to refer to */
  context(): CharacterDataContext {
    const namesOf = (extensions: string[]) =>
      new Set(
        globSync(`${this.root}/resources/**/*.@(${extensions.join("|")})`).map(
          resourceName,
        ),
      );
    return {
      imageNames: namesOf(IMAGE_EXTENSIONS),
      soundNames: namesOf(SOUND_EXTENSIONS),
      weaponNames: new Set([...GUNS, ...MELEE_WEAPONS].map((w) => w.name)),
    };
  }

  updateCharacter(id: string, changes: CharacterChanges) {
    return this.serially(async () => {
      const data = this.read(id);
      const { voice, ...rest } = pick(changes, [...CHARACTER_FIELDS]);
      Object.assign(data, rest);
      if (voice === null) {
        delete data.voice;
      } else if (voice) {
        data.voice = voice;
      }
      await this.write(id, data);
      return data;
    });
  }

  updateClip(id: string, file: string, changes: ClipChanges) {
    return this.serially(async () => {
      const data = this.read(id);
      const clip = findClip(data, file);
      const moving =
        changes.enabled !== undefined && changes.enabled !== clip.enabled;
      Object.assign(clip, pick(changes, ["text", "categories", "enabled"]));
      if (moving) {
        this.moveClipFile(id, clip);
        try {
          await this.regenerateManifest();
          await this.write(id, data);
        } catch (error) {
          // Put the file back so the data and the folders still agree
          clip.enabled = !clip.enabled;
          this.moveClipFile(id, clip);
          await this.regenerateManifest();
          throw error;
        }
      } else {
        await this.write(id, data);
      }
      return clip;
    });
  }

  deleteClip(id: string, file: string) {
    return this.serially(async () => {
      const data = this.read(id);
      const clip = findClip(data, file);
      data.clips = data.clips.filter((c) => c !== clip);
      const filePath = this.clipPath(id, file);
      if (filePath) {
        fs.rmSync(filePath);
      }
      if (clip.enabled) {
        await this.regenerateManifest();
      }
      await this.write(id, data);
    });
  }

  /**
   * Makes `count` new takes of a line with the character's voice. They're
   * disabled, so they don't ship until someone has listened and enabled them.
   */
  async generate(id: string, request: GenerateRequest): Promise<VoiceClip[]> {
    const { voice } = this.read(id);
    if (!voice?.elevenLabsVoiceId) {
      throw new BadRequest(`${id} has no ElevenLabs voice`);
    }
    if (!request.text.trim()) {
      throw new BadRequest("Nothing to say");
    }
    if (request.categories.length === 0) {
      throw new BadRequest("A clip needs at least one category");
    }
    const count = Math.max(1, Math.min(10, Math.floor(request.count)));
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "generate-"));
    try {
      // The slow part runs in parallel, outside the queue: generating, then
      // trimming and leveling each take into a flac like the recordings
      const takes = await Promise.all(
        Array.from({ length: count }, async (_, i) => {
          const { audio, extension } = await this.speech.generate({
            text: request.text,
            voiceId: voice.elevenLabsVoiceId,
            model: GENERATION_MODEL,
            stability: request.stability,
          });
          const raw = path.join(temp, `${i}.${extension}`);
          const cleaned = path.join(temp, `${i}-cleaned.flac`);
          fs.writeFileSync(raw, audio);
          await this.cleanUpAudio(raw, cleaned);
          return cleaned;
        }),
      );
      return await this.addGeneratedClips(
        id,
        request,
        voice.elevenLabsVoiceId,
        takes,
      );
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }

  private addGeneratedClips(
    id: string,
    request: GenerateRequest,
    voiceId: string,
    takes: string[],
  ): Promise<VoiceClip[]> {
    return this.serially(async () => {
      const data = this.read(id);
      // Today where you are, not in UTC
      const created = new Date().toLocaleDateString("sv-SE");
      const dir = this.audioDir(id, false);
      fs.mkdirSync(dir, { recursive: true });
      const clips = takes.map((take) => {
        const file = this.nextFileName(id, request.categories[0], "flac");
        fs.copyFileSync(take, path.join(dir, file));
        const clip: VoiceClip = {
          file,
          text: request.text,
          categories: request.categories,
          enabled: false,
          source: "elevenlabs",
          voiceId,
          model: GENERATION_MODEL,
          created,
        };
        if (request.stability !== undefined) {
          clip.stability = request.stability;
        }
        if (request.basedOn) {
          clip.basedOn = request.basedOn;
        }
        return clip;
      });
      data.clips.push(...clips);
      await this.write(id, data);
      return clips;
    });
  }

  /**
   * Trims the silence off a clip's ends and sets its loudness, replacing its
   * file. Same name and format, so nothing else changes.
   */
  cleanUp(id: string, file: string) {
    return this.serially(async () => {
      const clip = findClip(this.read(id), file);
      const filePath = this.clipPath(id, file);
      if (!filePath) {
        throw new NotFound(`${file} has no audio file`);
      }
      const temp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-up-"));
      try {
        const cleaned = path.join(temp, file);
        await this.cleanUpAudio(filePath, cleaned);
        fs.copyFileSync(cleaned, filePath);
      } finally {
        fs.rmSync(temp, { recursive: true, force: true });
      }
      return clip;
    });
  }

  /** Replaces a clip's text with what speech-to-text hears in it */
  async transcribe(id: string, file: string): Promise<VoiceClip> {
    const filePath = this.clipPath(id, file);
    if (!filePath) {
      throw new NotFound(`${file} has no audio file`);
    }
    const text = await this.speech.transcribe(filePath);
    return this.updateClip(id, file, { text });
  }

  /** `<id>-<stem>-<n>.<extension>`, with n free in both audio folders */
  private nextFileName(
    id: string,
    category: CharacterSoundClass,
    extension: string,
  ): string {
    const taken = new Set(
      [true, false]
        .flatMap((enabled) => {
          const dir = this.audioDir(id, enabled);
          return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        })
        .map((file) => resourceName(file)),
    );
    for (let n = 1; ; n++) {
      const file = `${id}-${FILE_STEMS[category]}-${n}.${extension}`;
      if (!taken.has(resourceName(file))) {
        return file;
      }
    }
  }

  private moveClipFile(id: string, clip: VoiceClip) {
    const from = path.join(this.audioDir(id, !clip.enabled), clip.file);
    const to = path.join(this.audioDir(id, clip.enabled), clip.file);
    if (!fs.existsSync(from)) {
      throw new NotFound(`${clip.file} isn't in ${path.dirname(from)}`);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
  }

  private async write(id: string, data: CharacterData) {
    const problems = characterDataProblems(id, data, this.context());
    if (problems.length > 0) {
      throw new BadRequest(problems.join("\n"));
    }
    // Indented first, so prettier keeps objects expanded the way they are in
    // the files, and an edit only changes the lines it touches
    const json = await prettier.format(JSON.stringify(data, null, 2), {
      parser: "json",
    });
    fs.writeFileSync(path.join(this.dataDir, `${id}.json`), json);
  }

  /** Runs changes one at a time, so two requests can't both read the old data */
  private serially<T>(run: () => Promise<T>): Promise<T> {
    const result = this.queue.then(run);
    this.queue = result.catch(() => {});
    return result;
  }
}

export class NotFound extends Error {}
export class BadRequest extends Error {}

function findClip(data: CharacterData, file: string): VoiceClip {
  const clip = data.clips.find((c) => c.file === file);
  if (!clip) {
    throw new NotFound(`No clip ${file}`);
  }
  return clip;
}

function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[],
): Partial<T> {
  return Object.fromEntries(
    keys
      .filter((key) => object[key] !== undefined)
      .map((key) => [key, object[key]]),
  ) as unknown as Partial<T>;
}
