/**
 * Cleans up voice clips so generated takes sit with the recordings: trims the
 * silence at both ends and turns the whole clip up or down to one loudness.
 * Uses the ffmpeg from ffmpeg-static, like the audio transformer.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

/**
 * Loudness to set clips to, in LUFS. The recordings range from about -12 to
 * -33, mostly around -25; ElevenLabs takes come out around -17 to -23.
 */
export const TARGET_LOUDNESS = -24;
/** Peaks stay below this, in dBTP, even if the clip ends up quieter than the target */
export const PEAK_CEILING = -1.5;
/** Quieter than this at the ends counts as silence, in dB */
const SILENCE_THRESHOLD = -50;
/** How much silence to leave at each end, in seconds, so words don't start abruptly */
const KEEP_SILENCE = 0.03;

const run = promisify(execFile);

export interface CleanUpResult {
  /** Loudness before, in LUFS, or null if the clip was too short to measure */
  loudnessBefore: number | null;
  /** How much it was turned up (or down, if negative), in dB */
  gain: number;
}

/**
 * Writes a cleaned-up copy of `input` to `output`. The output's format comes
 * from its extension (flac, mp3, wav or ogg).
 */
export async function cleanUpAudio(
  input: string,
  output: string,
): Promise<CleanUpResult> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clean-up-"));
  try {
    const trimmed = path.join(dir, "trimmed.wav");
    const silence = `start_periods=1:start_threshold=${SILENCE_THRESHOLD}dB:start_silence=${KEEP_SILENCE}`;
    // Trimming the end is trimming the start of it reversed
    await ffmpeg([
      "-i",
      input,
      "-af",
      `silenceremove=${silence},areverse,silenceremove=${silence},areverse`,
      trimmed,
    ]);

    const { loudness, peak } = await measure(trimmed);
    const gain =
      loudness === null
        ? // Too short for integrated loudness: go by the peak alone
          PEAK_CEILING - 3 - peak
        : Math.min(TARGET_LOUDNESS - loudness, PEAK_CEILING - peak);

    await ffmpeg([
      "-i",
      trimmed,
      "-af",
      `volume=${gain.toFixed(2)}dB`,
      ...encoderOptions(output),
      output,
    ]);
    return { loudnessBefore: loudness, gain };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function measure(
  file: string,
): Promise<{ loudness: number | null; peak: number }> {
  const { stderr } = await ffmpeg(
    ["-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
    { quiet: false },
  );
  const stats = JSON.parse(stderr.slice(stderr.lastIndexOf("{")));
  const loudness = Number(stats.input_i);
  const peak = Number(stats.input_tp);
  return {
    loudness: Number.isFinite(loudness) ? loudness : null,
    peak: Number.isFinite(peak) ? peak : PEAK_CEILING,
  };
}

function encoderOptions(output: string): string[] {
  switch (path.extname(output)) {
    case ".mp3":
      return ["-c:a", "libmp3lame", "-q:a", "2"];
    case ".flac":
      return ["-c:a", "flac"];
    default:
      return [];
  }
}

async function ffmpeg(args: string[], { quiet = true } = {}) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static has no ffmpeg for this platform");
  }
  return run(
    ffmpegPath,
    [
      "-hide_banner",
      "-nostats",
      "-y",
      ...(quiet ? ["-loglevel", "error"] : []),
      ...args,
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
}
