// Encodes lossless sounds (.flac, .wav) to Opus in an Ogg container in
// production builds, so resources/audio keeps the full-quality originals that
// get edited, and the game ships files a fraction of the size. Code keeps
// referring to sounds by name and the manifest keeps pointing at the .flac;
// only the file that ends up in the build is an .ogg. The dev server serves
// the originals as they are (Chromium decodes FLAC and WAV), so it never waits
// on ffmpeg.
//
// Ogg rather than MP3 because Ogg records exactly how much encoder padding to
// trim from each end, so loops stay seamless.
//
// Encoded files are cached in node_modules/.cache/encoded-audio, keyed by the
// source file's contents and the encoder settings, so only new or changed
// sounds are encoded, and switching branches back and forth is free.

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffmpegPackage from "ffmpeg-static/package.json" with { type: "json" };
import type { Plugin } from "vite";

/** Opus bitrates in kbps, by channel count */
const DEFAULT_BITRATES = { mono: 64, stereo: 128 };

/**
 * Bitrates for particular folders, relative to resources/audio, when the
 * defaults aren't right for them. The longest matching folder wins, e.g.
 * `music: { mono: 96, stereo: 192 }`.
 */
const FOLDER_BITRATES: Record<string, typeof DEFAULT_BITRATES> = {};

/** About one ffmpeg per core */
const MAX_ENCODES = Math.max(1, os.availableParallelism());

const LOSSLESS_URL = /\.(flac|wav)\?url$/;

export function encodeAudio(projectRoot: string): Plugin {
  const cacheDir = path.join(projectRoot, "node_modules/.cache/encoded-audio");
  return {
    name: "highrise:encode-audio",
    apply: "build",
    // Before Vite's own asset handling, which would copy the .flac as it is
    enforce: "pre",
    async load(id) {
      if (!LOSSLESS_URL.test(id)) {
        return null;
      }
      const filePath = id.slice(0, id.indexOf("?"));
      this.addWatchFile(filePath);

      const source = await fs.promises.readFile(filePath);
      const channels = countChannels(source, filePath);
      const bitrate = bitrateFor(filePath, projectRoot, channels);
      const encoderArgs = [
        // Opus only does more than two channels with extra setup we don't need
        ...(channels > 2 ? ["-ac", "2"] : []),
        ...["-c:a", "libopus", "-b:a", `${bitrate}k`, "-map_metadata", "-1"],
      ];

      const key = crypto
        .createHash("sha1")
        .update(ffmpegPackage.version)
        .update(encoderArgs.join(" "))
        .update(source)
        .digest("hex");
      const cached = path.join(cacheDir, `${key}.ogg`);

      if (!fs.existsSync(cached)) {
        await fs.promises.mkdir(cacheDir, { recursive: true });
        // Encode next to the cached file and move it in when it's complete, so
        // a cancelled build never leaves half a file in the cache
        const partial = `${cached}.${crypto.randomUUID()}.partial`;
        try {
          await limitConcurrency(() => encode(filePath, encoderArgs, partial));
          await fs.promises.rename(partial, cached);
        } finally {
          await fs.promises.rm(partial, { force: true });
        }
      }

      const referenceId = this.emitFile({
        type: "asset",
        name: path.basename(filePath).replace(/\.\w+$/, ".ogg"),
        originalFileName: path.relative(projectRoot, filePath),
        source: await fs.promises.readFile(cached),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
    },
  };
}

/** Reads the channel count from a FLAC or WAV header. */
function countChannels(buffer: Buffer, filePath: string): number {
  // Some of our FLACs have an ID3 tag in front, which isn't really allowed
  // but everything reads anyway. Its size is 4 bytes of 7 bits each.
  let start = 0;
  if (buffer.toString("latin1", 0, 3) === "ID3") {
    start =
      10 +
      ((buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9]) +
      (buffer[5] & 0x10 ? 10 : 0);
  }
  const magic = buffer.toString("latin1", start, start + 4);
  if (magic === "fLaC") {
    // STREAMINFO is always the first metadata block. Its channel count is 3
    // bits, stored minus one, right after the 20-bit sample rate.
    return ((buffer[start + 20] >> 1) & 0x7) + 1;
  }
  if (magic === "RIFF") {
    // Walk the chunks to "fmt ", whose channel count follows the format tag
    for (let offset = 12; offset + 8 <= buffer.length;) {
      const size = buffer.readUInt32LE(offset + 4);
      if (buffer.toString("latin1", offset, offset + 4) === "fmt ") {
        return buffer.readUInt16LE(offset + 10);
      }
      offset += 8 + size + (size % 2);
    }
  }
  throw new Error(`Couldn't read the channel count of ${filePath}`);
}

function bitrateFor(
  filePath: string,
  projectRoot: string,
  channels: number,
): number {
  const relative = path
    .relative(path.join(projectRoot, "resources/audio"), filePath)
    .replaceAll("\\", "/");
  const folder = Object.keys(FOLDER_BITRATES)
    .filter((folder) => relative.startsWith(folder + "/"))
    .sort((a, b) => b.length - a.length)[0];
  const bitrates = folder ? FOLDER_BITRATES[folder] : DEFAULT_BITRATES;
  return channels === 1 ? bitrates.mono : bitrates.stereo;
}

let running = 0;
const waiting: (() => void)[] = [];

async function limitConcurrency<T>(task: () => Promise<T>): Promise<T> {
  if (running < MAX_ENCODES) {
    running += 1;
  } else {
    // Wait for a finished task to hand over its slot
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) {
      next();
    } else {
      running -= 1;
    }
  }
}

function encode(
  input: string,
  encoderArgs: string[],
  output: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath as unknown as string, [
      ...["-v", "error", "-y", "-i", input],
      ...encoderArgs,
      ...["-f", "ogg", output],
    ]);
    let stderr = "";
    ffmpeg.stderr.on("data", (data) => (stderr += data));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`ffmpeg failed (${code}) on ${input}:\n${stderr.trim()}`),
        );
      }
    });
  });
}
