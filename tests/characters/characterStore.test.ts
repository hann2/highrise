/**
 * Tests for the character editor's file handling (`CharacterStore`), in a
 * throwaway folder laid out like the repo, with speech generation faked.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, test } from "node:test";
import {
  CharacterStore,
  SpeechGenerator,
} from "../../bin/character-editor/CharacterStore";
import { CharacterData } from "../../src/highrise/characters/CharacterData";

const PARTS = ["head", "torso", "leftArm", "leftHand", "rightArm", "rightHand"];

let root: string;
let store: CharacterStore;
let manifestRegenerations: number;
let generated: { text: string; stability?: number }[];

const fakeSpeech: SpeechGenerator = {
  async generate({ text, stability }) {
    generated.push({ text, stability });
    return { audio: Buffer.from(`audio of ${text}`), extension: "mp3" };
  },
  async transcribe() {
    return "What they said";
  },
};

function writeFile(relativePath: string, content = "x") {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function exists(relativePath: string) {
  return fs.existsSync(path.join(root, relativePath));
}

function readData(): CharacterData {
  return JSON.parse(
    fs.readFileSync(
      path.join(root, "src/highrise/characters/data/tess.json"),
      "utf8",
    ),
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "character-store-"));
  for (const part of PARTS) {
    writeFile(`resources/images/characters/tess-${part}.png`);
  }
  writeFile("resources/audio/characters/tess/tess-hurt-1.flac");
  writeFile("assets/source/voices/tess/tess-hurt-2.mp3");
  const data: CharacterData = {
    name: "Tess",
    description: "",
    textures: Object.fromEntries(
      PARTS.map((part) => [
        part,
        `tess${part[0].toUpperCase()}${part.slice(1)}`,
      ]),
    ) as CharacterData["textures"],
    stats: {},
    startingWeapons: [],
    voice: { elevenLabsVoiceId: "voice123" },
    clips: [
      {
        file: "tess-hurt-1.flac",
        text: "Ow",
        categories: ["hurt"],
        enabled: true,
        source: "recorded",
      },
      {
        file: "tess-hurt-2.mp3",
        text: "Ouch",
        categories: ["hurt"],
        enabled: false,
        source: "elevenlabs",
      },
    ],
  };
  writeFile("src/highrise/characters/data/tess.json", JSON.stringify(data));
  manifestRegenerations = 0;
  generated = [];
  store = new CharacterStore(root, fakeSpeech, {
    regenerateManifest: async () => {
      manifestRegenerations++;
    },
    cleanUpAudio: async (input, output) => {
      fs.writeFileSync(output, `cleaned ${fs.readFileSync(input, "utf8")}`);
    },
  });
});

test("disabling a clip moves its file out of resources, and enabling moves it back", async () => {
  await store.updateClip("tess", "tess-hurt-1.flac", { enabled: false });
  assert.equal(
    exists("resources/audio/characters/tess/tess-hurt-1.flac"),
    false,
  );
  assert.equal(exists("assets/source/voices/tess/tess-hurt-1.flac"), true);
  assert.equal(readData().clips[0].enabled, false);
  assert.equal(manifestRegenerations, 1);

  await store.updateClip("tess", "tess-hurt-1.flac", { enabled: true });
  assert.equal(
    exists("resources/audio/characters/tess/tess-hurt-1.flac"),
    true,
  );
  assert.equal(readData().clips[0].enabled, true);
  assert.equal(manifestRegenerations, 2);
});

test("changing a clip's text or categories doesn't move it", async () => {
  await store.updateClip("tess", "tess-hurt-1.flac", {
    text: "[grunts] Ow",
    categories: ["hurt", "nearDeath"],
  });
  const clip = readData().clips[0];
  assert.equal(clip.text, "[grunts] Ow");
  assert.deepEqual(clip.categories, ["hurt", "nearDeath"]);
  assert.equal(manifestRegenerations, 0);
});

test("generating makes cleaned-up, disabled flac clips with free file names", async () => {
  const clips = await store.generate("tess", {
    text: "[pained] Not again",
    categories: ["hurt"],
    count: 2,
    stability: 0.5,
    basedOn: "tess-hurt-1.flac",
  });
  assert.deepEqual(
    clips.map((clip) => clip.file),
    ["tess-hurt-3.flac", "tess-hurt-4.flac"],
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, "assets/source/voices/tess/tess-hurt-3.flac"),
      "utf8",
    ),
    "cleaned audio of [pained] Not again",
  );
  assert.equal(generated.length, 2);
  assert.equal(generated[0].stability, 0.5);
  for (const clip of clips) {
    assert.equal(exists(`assets/source/voices/tess/${clip.file}`), true);
    assert.equal(clip.enabled, false);
    assert.equal(clip.source, "elevenlabs");
    assert.equal(clip.voiceId, "voice123");
    assert.equal(clip.basedOn, "tess-hurt-1.flac");
  }
  assert.equal(readData().clips.length, 4);
});

test("generating needs a voice, some text and a category", async () => {
  await store.updateCharacter("tess", { voice: null });
  assert.equal(readData().voice, undefined);
  await assert.rejects(
    store.generate("tess", { text: "Hi", categories: ["hurt"], count: 1 }),
    /no ElevenLabs voice/,
  );
  await store.updateCharacter("tess", { voice: { elevenLabsVoiceId: "v" } });
  await assert.rejects(
    store.generate("tess", { text: " ", categories: ["hurt"], count: 1 }),
  );
  await assert.rejects(
    store.generate("tess", { text: "Hi", categories: [], count: 1 }),
  );
  assert.equal(generated.length, 0);
});

test("deleting a clip removes its file and its entry", async () => {
  await store.deleteClip("tess", "tess-hurt-2.mp3");
  assert.equal(exists("assets/source/voices/tess/tess-hurt-2.mp3"), false);
  assert.deepEqual(
    readData().clips.map((clip) => clip.file),
    ["tess-hurt-1.flac"],
  );
  assert.equal(manifestRegenerations, 0);

  await store.deleteClip("tess", "tess-hurt-1.flac");
  assert.equal(manifestRegenerations, 1);
});

test("changes the game would refuse aren't written", async () => {
  const before = readData();
  await assert.rejects(
    store.updateCharacter("tess", {
      textures: { ...before.textures, head: "nope" },
    }),
    /isn't an image/,
  );
  await assert.rejects(
    store.updateCharacter("tess", { stats: { moveSpeed: "fast" as any } }),
    /should be a number/,
  );
  await assert.rejects(
    store.updateCharacter("tess", { startingWeapons: ["Laser"] }),
    /isn't a weapon/,
  );
  await assert.rejects(
    store.updateClip("tess", "tess-hurt-1.flac", {
      categories: ["dancing" as any],
    }),
    /unknown category/,
  );
  assert.deepEqual(readData(), before);
});

test("character changes keep the clips, and ignore unknown fields", async () => {
  await store.updateCharacter("tess", {
    name: "Tessa",
    stats: { moveSpeed: 1.2 },
    startingWeapons: ["Glock"],
    clips: [],
  } as any);
  const data = readData();
  assert.equal(data.name, "Tessa");
  assert.deepEqual(data.stats, { moveSpeed: 1.2 });
  assert.deepEqual(data.startingWeapons, ["Glock"]);
  assert.equal(data.clips.length, 2);
});

test("cleaning up replaces a clip's audio in place", async () => {
  await store.cleanUp("tess", "tess-hurt-1.flac");
  assert.equal(
    fs.readFileSync(
      path.join(root, "resources/audio/characters/tess/tess-hurt-1.flac"),
      "utf8",
    ),
    "cleaned x",
  );
  assert.equal(manifestRegenerations, 0);
  assert.equal(readData().clips.length, 2);
});

test("transcribing replaces a clip's text", async () => {
  await store.transcribe("tess", "tess-hurt-2.mp3");
  assert.equal(readData().clips[1].text, "What they said");
});

test("changes made at the same time all land", async () => {
  await Promise.all([
    store.updateClip("tess", "tess-hurt-1.flac", { text: "One" }),
    store.updateClip("tess", "tess-hurt-2.mp3", { text: "Two" }),
    store.updateCharacter("tess", { description: "Three" }),
  ]);
  const data = readData();
  assert.deepEqual(
    [data.clips[0].text, data.clips[1].text, data.description],
    ["One", "Two", "Three"],
  );
});

test("clip paths can't leave the character's folders", () => {
  assert.equal(store.clipPath("tess", "../../../package.json"), undefined);
  assert.ok(store.clipPath("tess", "tess-hurt-1.flac"));
});
