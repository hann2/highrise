import camelcase from "camelcase";

/**
 * The name an asset is referred to by in code: its file name without the
 * extension, camelCased. Used by the manifest generator, and by anything that
 * finds assets from their file names.
 */
export function resourceName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop()!;
  return camelcase(baseName.split(".")[0]);
}
