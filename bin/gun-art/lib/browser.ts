/**
 * Rendering and reading images in headless Chromium: the tools draw their sheets as HTML and screenshot them,
 * and read photos' pixels through a canvas.
 */
import { chromium, type Browser, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

let browser: Browser | undefined;

export async function newPage(
  viewport = { width: 1600, height: 1200 },
  scale = 2,
): Promise<Page> {
  browser ??= await chromium.launch();
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  // tsx compiles named functions with a __name() helper, which functions sent to the page still call
  await page.addInitScript("window.__name = (f) => f");
  await page.evaluate("window.__name = (f) => f");
  return page;
}

export async function closeBrowser(): Promise<void> {
  await browser?.close();
  browser = undefined;
}

/** A file as a data URL, for putting in a page */
export function dataUrl(file: string): string {
  const type = file.endsWith(".svg")
    ? "image/svg+xml"
    : file.endsWith(".jpg")
      ? "image/jpeg"
      : "image/png";
  return `data:${type};base64,` + fs.readFileSync(file).toString("base64");
}

export function svgDataUrl(svg: string): string {
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/** Lays out `body` on a page and screenshots the element `#sheet` in it (the body's content is wrapped in it) */
export async function renderSheet(
  body: string,
  out: string,
  background = "#d8d8d8",
): Promise<string> {
  const page = await newPage({ width: 4000, height: 3000 });
  await page.setContent(
    `<html><body style="margin:0;background:${background};font:15px -apple-system,sans-serif">` +
      `<div id="sheet" style="display:inline-block;background:${background}">${body}</div></body></html>`,
  );
  await page.waitForTimeout(300);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.locator("#sheet").screenshot({ path: out });
  await page.close();
  return out;
}

/** Runs `fn` in a page with the image at `url` drawn on a canvas, passing its pixels */
export async function withPixels<T, A>(
  url: string,
  fn: (
    image: { width: number; height: number; data: Uint8ClampedArray },
    args: A,
  ) => T,
  args: A,
): Promise<T> {
  const page = await newPage({ width: 400, height: 300 }, 1);
  const result = await page.evaluate(
    async ({ url, source, args }) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext("2d")!;
      g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height).data;
      // eslint-disable-next-line no-eval
      const f = (0, eval)(`(${source})`);
      return f({ width: c.width, height: c.height, data }, args);
    },
    { url, source: fn.toString(), args },
  );
  await page.close();
  return result as T;
}
