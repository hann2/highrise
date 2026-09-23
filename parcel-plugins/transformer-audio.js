// Encodes lossless sounds (.flac, .wav) to Opus in an Ogg container as Parcel
// bundles them, so resources/audio keeps the full-quality originals that get
// edited, and the game ships files a fraction of the size. Code keeps referring
// to sounds by name and the manifest keeps pointing at the .flac; only the
// file that ends up in the bundle is an .ogg.
//
// Ogg rather than MP3 because Ogg records exactly how much encoder padding to
// trim from each end, so loops stay seamless.
//
// Encoded files are also cached in node_modules/.cache/encoded-audio, keyed by
// the source file's contents and the encoder settings, so a deleted
// .parcel-cache (which `npm start` does) doesn't mean encoding everything
// again, and switching branches back and forth is free.

const { Transformer } = require("@parcel/plugin");
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const ffmpegVersion = require("ffmpeg-static/package.json").version;

/** Opus bitrates in kbps, by channel count */
const DEFAULT_BITRATES = { mono: 64, stereo: 128 };

/**
 * Bitrates for particular folders, relative to resources/audio, when the
 * defaults aren't right for them. The longest matching folder wins, e.g.
 * `music: { mono: 96, stereo: 192 }`.
 */
const FOLDER_BITRATES = {};

// Parcel runs this in each of its worker threads (4 of them on most machines)
// and hands each one many files at once, so keep the number of ffmpegs to
// about one per core in total
const MAX_ENCODES_PER_WORKER = Math.max(
  1,
  Math.ceil(os.availableParallelism() / 4),
);

module.exports = new Transformer({
  async transform({ asset, options }) {
    // Editing the settings above should re-encode, which Parcel doesn't know
    // to do for a plugin that isn't an npm package
    asset.invalidateOnFileChange(__filename);

    const source = await asset.getBuffer();
    const channels = countChannels(source, asset.filePath);
    const bitrate = bitrateFor(asset.filePath, options.projectRoot, channels);
    const encoderArgs = [
      // Opus only does more than two channels with extra setup we don't need
      ...(channels > 2 ? ["-ac", "2"] : []),
      ...["-c:a", "libopus", "-b:a", `${bitrate}k`, "-map_metadata", "-1"],
    ];

    const key = crypto
      .createHash("sha1")
      .update(ffmpegVersion)
      .update(encoderArgs.join(" "))
      .update(source)
      .digest("hex");
    const cacheDir = path.join(
      options.projectRoot,
      "node_modules/.cache/encoded-audio",
    );
    const cached = path.join(cacheDir, `${key}.ogg`);

    if (!fs.existsSync(cached)) {
      await fs.promises.mkdir(cacheDir, { recursive: true });
      // Encode next to the cached file and move it in when it's complete, so
      // a cancelled build or another worker never sees half a file. Workers
      // are threads in one process, so the name can't just use the pid.
      const partial = `${cached}.${crypto.randomUUID()}.partial`;
      try {
        await limitConcurrency(() =>
          encode(asset.filePath, encoderArgs, partial),
        );
        await fs.promises.rename(partial, cached);
      } finally {
        await fs.promises.rm(partial, { force: true });
      }
    }

    asset.type = "ogg";
    asset.setBuffer(await fs.promises.readFile(cached));
    return [asset];
  },
});

/** Reads the channel count from a FLAC or WAV header. */
function countChannels(buffer, filePath) {
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

function bitrateFor(filePath, projectRoot, channels) {
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
const waiting = [];

async function limitConcurrency(task) {
  if (running < MAX_ENCODES_PER_WORKER) {
    running += 1;
  } else {
    // Wait for a finished task to hand over its slot
    await new Promise((resolve) => waiting.push(resolve));
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

function encode(input, encoderArgs, output) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
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
