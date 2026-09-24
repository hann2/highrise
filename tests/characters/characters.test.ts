/**
 * Checks the character data in `src/highrise/characters/data/` against the
 * files on disk: every image, sound and weapon it names exists, enabled clips
 * are in resources/ and disabled ones in assets/, and no audio file is left
 * out. Plain node, no browser: `npm run test:characters`.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { CharacterStore } from "../../bin/character-editor/CharacterStore";
import {
  CharacterData,
  characterDataProblems,
} from "../../src/highrise/characters/CharacterData";

const ROOT = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(ROOT, "src/highrise/characters/data");
const ENABLED_DIR = path.join(ROOT, "resources/audio/characters");
const DISABLED_DIR = path.join(ROOT, "assets/source/voices");

const characters = fs
  .readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => ({
    id: path.basename(file, ".json"),
    data: JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
    ) as CharacterData,
  }));

function filesIn(dir: string): string[] {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((file) => !file.startsWith("."))
    : [];
}

test("character data refers only to things that exist", () => {
  const noSpeech = {} as ConstructorParameters<typeof CharacterStore>[1];
  const context = new CharacterStore(ROOT, noSpeech).context();
  const problems = characters.flatMap(({ id, data }) =>
    characterDataProblems(id, data, context),
  );
  assert.deepEqual(problems, []);
});

test("clips' files are where enabled says, and every file is a clip", () => {
  const problems: string[] = [];
  for (const { id, data } of characters) {
    const enabled = new Set(filesIn(path.join(ENABLED_DIR, id)));
    const disabled = new Set(filesIn(path.join(DISABLED_DIR, id)));
    for (const clip of data.clips) {
      const [here, there] = clip.enabled
        ? [enabled, "resources"]
        : [disabled, "assets"];
      if (!here.has(clip.file)) {
        problems.push(`${id}: ${clip.file} isn't in ${there}`);
      }
    }
    const listed = new Set(data.clips.map((clip) => clip.file));
    for (const file of [...enabled, ...disabled]) {
      if (!listed.has(file)) {
        problems.push(`${id}: ${file} isn't a clip`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("every character's data is loaded by Character.ts", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "src/highrise/characters/Character.ts"),
    "utf8",
  );
  const missing = characters
    .map(({ id }) => id)
    .filter((id) => !source.includes(`"./data/${id}.json"`));
  assert.deepEqual(missing, []);
});
