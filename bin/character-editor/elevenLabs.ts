/**
 * The few ElevenLabs calls the character editor makes. The key comes from
 * ELEVENLABS_API_KEY in the environment or .env, and never reaches the
 * browser: the editor's page asks the editor server, which asks ElevenLabs.
 */
import fs from "node:fs";
import path from "node:path";
import { Voice } from "../../src/tools/character-editor/apiTypes";
import { SpeechGenerator } from "./CharacterStore";

const API = "https://api.elevenlabs.io";

export function readApiKey(root: string): string | undefined {
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY;
  }
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    return undefined;
  }
  const match = fs
    .readFileSync(envPath, "utf8")
    .match(/^ELEVENLABS_API_KEY=(.*)$/m);
  return match?.[1].trim() || undefined;
}

export class ElevenLabs implements SpeechGenerator {
  constructor(private apiKey: string | undefined) {}

  async generate({
    text,
    voiceId,
    model,
    stability,
  }: {
    text: string;
    voiceId: string;
    model: string;
    stability?: number;
  }) {
    const response = await this.request(
      `/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: model,
          ...(stability !== undefined ? { voice_settings: { stability } } : {}),
        }),
      },
    );
    return {
      audio: Buffer.from(await response.arrayBuffer()),
      extension: "mp3",
    };
  }

  async transcribe(file: string): Promise<string> {
    const form = new FormData();
    form.append("model_id", "scribe_v2");
    form.append("tag_audio_events", "true");
    form.append("language_code", "en");
    form.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
    const response = await this.request("/v1/speech-to-text", {
      method: "POST",
      body: form,
    });
    const result = (await response.json()) as { text?: string };
    return (result.text ?? "").trim();
  }

  async voices(): Promise<Voice[]> {
    const response = await this.request("/v1/voices");
    const result = (await response.json()) as {
      voices: {
        voice_id: string;
        name: string;
        description?: string;
        category: string;
        preview_url?: string;
        labels?: Record<string, string>;
      }[];
    };
    return result.voices.map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      description: voice.description ?? "",
      category: voice.category,
      previewUrl: voice.preview_url,
      labels: voice.labels ?? {},
    }));
  }

  private async request(url: string, init: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error("No ELEVENLABS_API_KEY in the environment or .env");
    }
    const response = await fetch(API + url, {
      ...init,
      headers: { ...init.headers, "xi-api-key": this.apiKey },
    });
    if (!response.ok) {
      throw new Error(
        `ElevenLabs ${response.status}: ${await response.text()}`,
      );
    }
    return response;
  }
}
