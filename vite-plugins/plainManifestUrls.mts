// The manifest (resources/resources.ts) imports every asset with `?url`. In a
// build that's what gives each asset its hashed file, but the dev server turns
// each of those imports into a module of its own, which the browser has to
// fetch before the game can start: over 800 requests. In development the
// manifest's imports are rewritten to the files' own URLs instead, so the
// browser only fetches the assets themselves, when the preloader asks.

import type { Plugin } from "vite";

const URL_IMPORT = /^import (\w+) from "(\.\/[^"]+)\?url";$/gm;

export function plainManifestUrls(): Plugin {
  return {
    name: "highrise:plain-manifest-urls",
    apply: "serve",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("/resources/resources.ts")) {
        return null;
      }
      return code.replace(
        URL_IMPORT,
        (_, name, file) =>
          `const ${name} = new URL(${JSON.stringify(file)}, import.meta.url).href;`,
      );
    },
  };
}
