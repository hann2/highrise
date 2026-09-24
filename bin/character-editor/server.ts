/**
 * The character editor's server: a small JSON API over `CharacterStore` and
 * ElevenLabs. `npm start` runs it next to Parcel, which forwards `/api` to it
 * (`.proxyrc.json`), so the editor page at
 * http://localhost:1234/tools/character-editor/ talks to it on the same origin.
 *
 *   npm run character-editor   # just this server, on CHARACTER_EDITOR_PORT (1235)
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import {
  BadRequest,
  CharacterChanges,
  CharacterStore,
  ClipChanges,
  GenerateRequest,
  NotFound,
} from "./CharacterStore";
import { ElevenLabs, readApiKey } from "./elevenLabs";

const ROOT = path.resolve(__dirname, "../..");
const PORT = Number(process.env.CHARACTER_EDITOR_PORT ?? 1235);

const AUDIO_TYPES: Record<string, string> = {
  ".flac": "audio/flac",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

const elevenLabs = new ElevenLabs(readApiKey(ROOT));
const store = new CharacterStore(ROOT, elevenLabs, async () => {
  await promisify(execFile)(
    path.join(ROOT, "node_modules/.bin/tsx"),
    ["bin/generate-manifest.ts"],
    { cwd: ROOT },
  );
});

type Handler = (
  params: string[],
  body: any,
  response: http.ServerResponse,
) => Promise<unknown>;

const ROUTES: [method: string, pattern: RegExp, handler: Handler][] = [
  [
    "GET",
    /^\/api\/characters$/,
    async () => store.ids().map((id) => ({ id, data: store.read(id) })),
  ],
  [
    "PATCH",
    /^\/api\/characters\/([\w-]+)$/,
    ([id], body: CharacterChanges) => store.updateCharacter(id, body),
  ],
  [
    "POST",
    /^\/api\/characters\/([\w-]+)\/generate$/,
    ([id], body: GenerateRequest) => store.generate(id, body),
  ],
  [
    "PATCH",
    /^\/api\/characters\/([\w-]+)\/clips\/([^/]+)$/,
    ([id, file], body: ClipChanges) => store.updateClip(id, file, body),
  ],
  [
    "DELETE",
    /^\/api\/characters\/([\w-]+)\/clips\/([^/]+)$/,
    async ([id, file]) => {
      await store.deleteClip(id, file);
      return {};
    },
  ],
  [
    "POST",
    /^\/api\/characters\/([\w-]+)\/clips\/([^/]+)\/transcribe$/,
    ([id, file]) => store.transcribe(id, file),
  ],
  [
    "GET",
    /^\/api\/characters\/([\w-]+)\/audio\/([^/]+)$/,
    async ([id, file], _, response) => {
      const filePath = store.clipPath(id, file);
      if (!filePath) {
        throw new NotFound(`No audio for ${file}`);
      }
      response.writeHead(200, {
        "Content-Type":
          AUDIO_TYPES[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(filePath).pipe(response);
    },
  ],
  ["GET", /^\/api\/voices$/, () => elevenLabs.voices()],
];

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const route = ROUTES.find(
    ([method, pattern]) =>
      method === request.method && pattern.test(url.pathname),
  );
  try {
    if (!route) {
      throw new NotFound(`No route for ${request.method} ${url.pathname}`);
    }
    const [, pattern, handler] = route;
    const params = pattern.exec(url.pathname)!.slice(1).map(decodeURIComponent);
    const body = await readBody(request);
    const result = await handler(params, body, response);
    if (!response.headersSent) {
      sendJson(response, 200, result ?? {});
    }
  } catch (error) {
    const status =
      error instanceof NotFound ? 404 : error instanceof BadRequest ? 400 : 500;
    if (status === 500) {
      console.error(error);
    }
    if (!response.headersSent) {
      sendJson(response, status, { error: (error as Error).message });
    }
  }
});

async function readBody(request: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BadRequest("The body isn't JSON");
  }
}

function sendJson(
  response: http.ServerResponse,
  status: number,
  body: unknown,
) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

// Only this machine: it writes files and spends ElevenLabs credits
server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Character editor server on port ${PORT}: http://localhost:1234/tools/character-editor/`,
  );
});
