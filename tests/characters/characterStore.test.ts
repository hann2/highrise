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
  VoiceConversion,
} from "../../bin/character-editor/CharacterStore";
import { CharacterData } from "../../src/highrise/characters/CharacterData";
import { moveClip } from "../../src/tools/character-editor/clipOrder";

let root: string;
let store: CharacterStore;
let manifestRegenerations: number;
let generated: { text: string; stability?: number }[];
let converted: VoiceConversion[];

const fakeSpeech: SpeechGenerator = {
  async generate({ text, stability }) {
    generated.push({ text, stability });
    return { audio: Buffer.from(`audio of ${text}`), extension: "mp3" };
  },
  async convert(request) {
    converted.push(request);
    const performance = fs.readFileSync(request.file, "utf8");
    return { audio: Buffer.from(`voice of ${performance}`), extension: "mp3" };
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
  writeFile("resources/audio/characters/tess/tess-hurt-1.flac");
  writeFile("assets/source/voices/tess/tess-hurt-2.mp3");
  const data: CharacterData = {
    name: "Tess",
    description: "",
    look: { skin: "#e0b48f", seed: 1 },
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
  converted = [];
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

test("the voice changer makes disabled takes of a clip's performance, with its text and categories", async () => {
  writeFile("resources/audio/characters/tess/tess-hurt-1.flac", "a groan");
  const clips = await store.convert("tess", "tess-hurt-1.flac", {
    count: 2,
    model: "eleven_english_sts_v2",
    stability: 0.3,
    similarity: 2,
    removeBackgroundNoise: true,
  });
  assert.deepEqual(
    clips.map((clip) => clip.file),
    ["tess-hurt-3.flac", "tess-hurt-4.flac"],
  );
  // The recording is cleaned up before it's sent, and each take after
  assert.equal(converted.length, 2);
  assert.equal(converted[0].voiceId, "voice123");
  assert.equal(converted[0].similarity, 1);
  assert.equal(
    fs.readFileSync(
      path.join(root, "assets/source/voices/tess/tess-hurt-3.flac"),
      "utf8",
    ),
    "cleaned voice of cleaned a groan",
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, "resources/audio/characters/tess/tess-hurt-1.flac"),
      "utf8",
    ),
    "a groan",
  );
  for (const clip of clips) {
    assert.equal(clip.text, "Ow");
    assert.deepEqual(clip.categories, ["hurt"]);
    assert.equal(clip.enabled, false);
    assert.equal(clip.source, "elevenlabs");
    assert.equal(clip.model, "eleven_english_sts_v2");
    assert.equal(clip.stability, 0.3);
    assert.equal(clip.similarity, 1);
    assert.equal(clip.removeBackgroundNoise, true);
    assert.equal(clip.basedOn, "tess-hurt-1.flac");
  }
  assert.equal(readData().clips.length, 4);
  assert.equal(manifestRegenerations, 0);
});

test("the voice changer needs a voice, a voice changer model and a clip", async () => {
  const request = {
    count: 1,
    model: "eleven_english_sts_v2" as const,
    stability: 0.5,
    similarity: 0.75,
    removeBackgroundNoise: false,
  };
  await assert.rejects(
    store.convert("tess", "tess-hurt-1.flac", {
      ...request,
      model: "eleven_v3" as any,
    }),
    /isn't a voice changer model/,
  );
  await assert.rejects(store.convert("tess", "tess-nope.flac", request));
  await store.updateCharacter("tess", { voice: null });
  await assert.rejects(
    store.convert("tess", "tess-hurt-1.flac", request),
    /no ElevenLabs voice/,
  );
  assert.equal(converted.length, 0);
});

test("moveClip puts a clip before or after another, or last, without changing the list", () => {
  const clips = ["a", "b", "c"].map((file) => ({
    file,
    text: "",
    categories: ["hurt" as const],
    enabled: false,
    source: "recorded" as const,
  }));
  const files = (moved?: { file: string }[]) => moved?.map((c) => c.file);
  assert.deepEqual(files(moveClip(clips, "c", { before: "a" })), [
    "c",
    "a",
    "b",
  ]);
  assert.deepEqual(files(moveClip(clips, "a", { after: "b" })), [
    "b",
    "a",
    "c",
  ]);
  assert.deepEqual(files(moveClip(clips, "a", {})), ["b", "c", "a"]);
  assert.deepEqual(files(moveClip(clips, "b", { after: "b" })), [
    "a",
    "b",
    "c",
  ]);
  assert.equal(moveClip(clips, "a", { before: "nope" }), undefined);
  assert.equal(moveClip(clips, "nope", {}), undefined);
  const recategorized = moveClip(clips, "a", {
    after: "c",
    categories: ["death"],
  })!;
  assert.deepEqual(recategorized[2].categories, ["death"]);
  assert.deepEqual(clips[0].categories, ["hurt"]);
  assert.deepEqual(files(clips), ["a", "b", "c"]);
});

test("moving a clip saves the new order, and its categories if they change", async () => {
  await store.moveClip("tess", "tess-hurt-2.mp3", {
    before: "tess-hurt-1.flac",
  });
  assert.deepEqual(
    readData().clips.map((clip) => clip.file),
    ["tess-hurt-2.mp3", "tess-hurt-1.flac"],
  );
  const clip = await store.moveClip("tess", "tess-hurt-2.mp3", {
    after: "tess-hurt-1.flac",
    categories: ["hurt", "nearDeath"],
  });
  assert.deepEqual(clip.categories, ["hurt", "nearDeath"]);
  assert.deepEqual(
    readData().clips.map((clip) => [clip.file, clip.categories]),
    [
      ["tess-hurt-1.flac", ["hurt"]],
      ["tess-hurt-2.mp3", ["hurt", "nearDeath"]],
    ],
  );
  await assert.rejects(
    store.moveClip("tess", "tess-hurt-2.mp3", { categories: [] }),
    /at least one category/,
  );
  await assert.rejects(
    store.moveClip("tess", "tess-hurt-2.mp3", { before: "tess-nope.flac" }),
  );
  assert.equal(manifestRegenerations, 0);
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
      look: { ...before.look, build: { shoulders: 3 } },
    }),
    /isn't from -1 to 1/,
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
    store.updateCharacter("tess", {
      look: { ...before.look, pants: "blue" },
    }),
    /isn't a color/,
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
    look: { pants: "#112233", shoes: "#445566", seed: 2 },
    clips: [],
  } as any);
  const data = readData();
  assert.equal(data.name, "Tessa");
  assert.deepEqual(data.stats, { moveSpeed: 1.2 });
  assert.deepEqual(data.startingWeapons, ["Glock"]);
  assert.deepEqual(data.look, { pants: "#112233", shoes: "#445566", seed: 2 });
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
