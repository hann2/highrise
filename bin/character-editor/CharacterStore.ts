/**
 * Reads and writes the character data (`src/highrise/characters/data/`) and
 * the clips' audio files for the character editor. Every change is checked
 * with `characterDataProblems` before it's written, so the editor can't save
 * data the game would refuse.
 */
import fs from "node:fs";
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

export interface GenerateRequest {
  text: string;
  categories: CharacterSoundClass[];
  count: number;
  stability?: number;
  basedOn?: string;
}

/** The part of a clip the editor can change directly */
export type ClipChanges = Partial<
  Pick<VoiceClip, "text" | "categories" | "enabled">
>;

/**
 * The part of a character the editor can change directly (clips have their
 * own calls). A `voice` of null removes it.
 */
export type CharacterChanges = Partial<
  Omit<CharacterData, "clips" | "voice"> & {
    voice: CharacterData["voice"] | null;
  }
>;

const CHARACTER_FIELDS = [
  "name",
  "description",
  "textures",
  "stats",
  "startingWeapons",
  "voice",
] as const;

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

  constructor(
    readonly root: string,
    private speech: SpeechGenerator,
    /** Called after clip files are added to or removed from resources/ */
    private regenerateManifest: () => Promise<void> = async () => {},
  ) {
    this.dataDir = path.join(root, "src/highrise/characters/data");
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
    // The slow part runs in parallel, outside the queue
    const takes = await Promise.all(
      Array.from({ length: count }, () =>
        this.speech.generate({
          text: request.text,
          voiceId: voice.elevenLabsVoiceId,
          model: GENERATION_MODEL,
          stability: request.stability,
        }),
      ),
    );
    return this.serially(async () => {
      const data = this.read(id);
      const created = new Date().toISOString().slice(0, 10);
      const dir = this.audioDir(id, false);
      fs.mkdirSync(dir, { recursive: true });
      const clips = takes.map(({ audio, extension }) => {
        const file = this.nextFileName(id, request.categories[0], extension);
        fs.writeFileSync(path.join(dir, file), audio);
        const clip: VoiceClip = {
          file,
          text: request.text,
          categories: request.categories,
          enabled: false,
          source: "elevenlabs",
          voiceId: voice.elevenLabsVoiceId,
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
    const json = await prettier.format(JSON.stringify(data), {
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
