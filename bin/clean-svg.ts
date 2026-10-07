import fs from "fs";
import path from "path";
import zlib from "zlib";

/*
 * Cleans up an SVG exported from a design app (Affinity Designer, so far)
 * into one that's readable and easy to edit by hand: every transform is
 * folded into the coordinates (so a shape's numbers are where it is),
 * groups with nothing but a transform are taken apart, named groups keep
 * their names (Affinity's `serif:id`) as ids, styles become attributes,
 * gradients are plain `x1 y1 x2 y2` where they can be, and embedded strips
 * of pixels become gradients. The size is set in `width`/`height` as well
 * as the viewBox.
 *
 *   npx tsx bin/clean-svg.ts --out <folder> [--origin X,Y|center --scale S] <file.svg>...
 *
 * Gradient and clip ids start with the file's name, so several SVGs can
 * share one document. `--origin` puts the drawing's origin at X,Y (in the
 * input's units, from its top left) or its middle, and `--scale` scales it,
 * with the viewBox around it.
 *
 * Only what the exports here use is handled: g, rect, circle, path (M L C Z,
 * absolute), linearGradient, clipPath, and use of an embedded PNG.
 */

// --- A small XML parser, for well-formed exports ---

interface Element {
  name: string;
  attrs: Map<string, string>;
  children: Element[];
}

function parseXml(text: string): Element {
  const root: Element = { name: "#root", attrs: new Map(), children: [] };
  const stack = [root];
  const tag =
    /<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|<\?[^>]*\?>|<!--[\s\S]*?-->|<![^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(text))) {
    const [, closing, name, attrText, selfClosing] = match;
    if (!name) continue;
    if (closing) {
      const open = stack.pop()!;
      if (open.name !== name) {
        throw new Error(`Mismatched </${name}> (open: <${open.name}>)`);
      }
      continue;
    }
    const attrs = new Map<string, string>();
    for (const [, key, value] of (attrText ?? "").matchAll(
      /([\w:.-]+)\s*=\s*"([^"]*)"/g,
    )) {
      attrs.set(key, value);
    }
    const element: Element = { name, attrs, children: [] };
    stack[stack.length - 1].children.push(element);
    if (!selfClosing) stack.push(element);
  }
  return root.children[0];
}

// --- Affine transforms: [a, b, c, d, e, f] as in SVG's matrix() ---

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function parseTransform(text: string | undefined): Matrix {
  let result = IDENTITY;
  for (const [, kind, args] of (text ?? "").matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    let m: Matrix;
    if (kind === "matrix") m = v as Matrix;
    else if (kind === "translate") m = [1, 0, 0, 1, v[0], v[1] ?? 0];
    else if (kind === "scale") m = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else throw new Error(`Unhandled transform ${kind}`);
    result = multiply(result, m);
  }
  return result;
}

const EPSILON = 1e-6;
const isAxisAligned = (m: Matrix) =>
  Math.abs(m[1]) < EPSILON && Math.abs(m[2]) < EPSILON;
const determinant = (m: Matrix) => m[0] * m[3] - m[1] * m[2];

// --- Output formatting ---

/** A number to 3 decimals, without trailing zeros */
function n(x: number): string {
  const s = (Math.round(x * 1000) / 1000).toFixed(3);
  const t = s.replace(/\.?0+$/, "");
  return t === "-0" ? "0" : t;
}

function hex(color: string): string {
  const rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!rgb) return color;
  return (
    "#" +
    rgb
      .slice(1)
      .map((c) => Number(c).toString(16).padStart(2, "0"))
      .join("")
  );
}

// --- Path data ---

type Segment = { command: string; points: [number, number][] };

function parsePath(d: string): Segment[] {
  const segments: Segment[] = [];
  const counts: Record<string, number> = { M: 1, L: 1, C: 3, Z: 0 };
  for (const [, command, args] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    if (!(command in counts)) {
      throw new Error(`Unhandled path command ${command}`);
    }
    const v = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(
      Number,
    );
    const size = counts[command] * 2;
    if (size === 0) {
      segments.push({ command, points: [] });
      continue;
    }
    for (let i = 0; i < v.length; i += size) {
      const points: [number, number][] = [];
      for (let j = 0; j < size; j += 2) points.push([v[i + j], v[i + j + 1]]);
      // Repeated coordinates after M are lines
      const repeated = command === "M" && i > 0 ? "L" : command;
      segments.push({ command: repeated, points });
    }
  }
  return segments;
}

function formatPath(segments: Segment[], m: Matrix): string {
  return segments
    .map(
      ({ command, points }) =>
        command +
        points
          .map(([x, y]) => apply(m, x, y))
          .map(([x, y]) => `${n(x)},${n(y)}`)
          .join(" "),
    )
    .join(" ");
}

/**
 * How much a stroke's width scales under `m`: across each piece of the
 * outline, by how much `m` squashes it that way, averaged over the outline's
 * length (a horizontal line stretched up and down gets thicker by the
 * stretch; a loop by something in between)
 */
function strokeScale(m: Matrix, outline: Segment[] | undefined): number {
  const area = Math.abs(determinant(m));
  let total = 0;
  let weight = 0;
  let at: [number, number] | null = null;
  let start: [number, number] | null = null;
  for (const { command, points } of outline ?? []) {
    const end: [number, number] | null =
      command === "Z" ? start : points[points.length - 1];
    if (command === "M") {
      start = end;
    } else if (at && end) {
      const u = [end[0] - at[0], end[1] - at[1]];
      const local = Math.hypot(u[0], u[1]);
      const out = Math.hypot(
        m[0] * u[0] + m[2] * u[1],
        m[1] * u[0] + m[3] * u[1],
      );
      if (local > 1e-9 && out > 1e-9) {
        total += ((area * local) / out) * out;
        weight += out;
      }
    }
    at = end;
  }
  return weight > 0 ? total / weight : Math.sqrt(area);
}

function rectPath(x: number, y: number, w: number, h: number): Segment[] {
  return [
    { command: "M", points: [[x, y]] },
    { command: "L", points: [[x + w, y]] },
    { command: "L", points: [[x + w, y + h]] },
    { command: "L", points: [[x, y + h]] },
    { command: "Z", points: [] },
  ];
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  const k = 0.5522847498;
  const p = (x: number, y: number): [number, number] => [cx + x, cy + y];
  return [
    { command: "M", points: [p(rx, 0)] },
    { command: "C", points: [p(rx, ry * k), p(rx * k, ry), p(0, ry)] },
    { command: "C", points: [p(-rx * k, ry), p(-rx, ry * k), p(-rx, 0)] },
    { command: "C", points: [p(-rx, -ry * k), p(-rx * k, -ry), p(0, -ry)] },
    { command: "C", points: [p(rx * k, -ry), p(rx, -ry * k), p(rx, 0)] },
    { command: "Z", points: [] },
  ] as Segment[];
}

// --- The cleaner ---

interface Options {
  prefix: string;
  /** Applied on top of everything, e.g. to move the origin */
  outer: Matrix;
  viewBox: [number, number, number, number] | null;
}

/** Presentation attributes, in the order they're written */
const PRESENTATION = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "clip-rule",
  "opacity",
];

export function cleanSvg(text: string, options: Options): string {
  const svg = parseXml(text);
  const defs = new Map<string, Element>();
  const collectDefs = (element: Element) => {
    const id = element.attrs.get("id");
    if (
      id &&
      ["linearGradient", "radialGradient", "clipPath", "image"].includes(
        element.name,
      )
    ) {
      defs.set(id, element);
    }
    element.children.forEach(collectDefs);
  };
  collectDefs(svg);

  const outDefs: string[] = [];
  const gradientIds = new Map<string, string>();
  const usedNames = new Set<string>();
  let clipCount = 0;

  const uniqueName = (name: string) => {
    let unique = name;
    for (let i = 2; usedNames.has(unique); i++) unique = `${name}-${i}`;
    usedNames.add(unique);
    return unique;
  };

  /** A gradient used under `m`, made into one in the root's frame */
  const gradient = (id: string, m: Matrix): string => {
    const source = defs.get(id);
    if (!source || source.name !== "linearGradient") {
      throw new Error(`Unhandled paint server #${id}`);
    }
    if (source.attrs.get("gradientUnits") !== "userSpaceOnUse") {
      throw new Error(`Gradient #${id} isn't in user space`);
    }
    const g = multiply(
      m,
      parseTransform(source.attrs.get("gradientTransform")),
    );
    const [x1, y1] = [
      Number(source.attrs.get("x1")),
      Number(source.attrs.get("y1")),
    ];
    const [x2, y2] = [
      Number(source.attrs.get("x2")),
      Number(source.attrs.get("y2")),
    ];
    const stops = source.children
      .filter((c) => c.name === "stop")
      .map((stop) => {
        const style = parseStyle(stop.attrs.get("style"));
        const color =
          style.get("stop-color") ?? stop.attrs.get("stop-color") ?? "#000";
        const opacity = Number(
          style.get("stop-opacity") ?? stop.attrs.get("stop-opacity") ?? 1,
        );
        return (
          `<stop offset="${n(Number(stop.attrs.get("offset")))}" stop-color="${hex(color)}"` +
          (opacity !== 1 ? ` stop-opacity="${n(opacity)}"` : "") +
          "/>"
        );
      });
    // The gradient's axis, and the way across it, in the root's frame: if
    // they're still square to each other, the gradient is just its ends
    const linear = (x: number, y: number) => [
      g[0] * x + g[2] * y,
      g[1] * x + g[3] * y,
    ];
    const along = linear(x2 - x1, y2 - y1);
    const across = linear(-(y2 - y1), x2 - x1);
    const perpendicular =
      Math.abs(along[0] * across[0] + along[1] * across[1]) <
      1e-6 * Math.hypot(along[0], along[1]) * Math.hypot(across[0], across[1]);
    let geometry: string;
    if (perpendicular) {
      const [ax, ay] = apply(g, x1, y1);
      const [bx, by] = apply(g, x2, y2);
      geometry = `x1="${n(ax)}" y1="${n(ay)}" x2="${n(bx)}" y2="${n(by)}"`;
    } else {
      geometry =
        `x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ` +
        `gradientTransform="matrix(${g.map((v) => n(v)).join(",")})"`;
    }
    const body = `gradientUnits="userSpaceOnUse" ${geometry}>${stops.join("")}`;
    const existing = gradientIds.get(body);
    if (existing) return existing;
    const newId = `${options.prefix}gradient-${gradientIds.size + 1}`;
    gradientIds.set(body, newId);
    outDefs.push(
      `<linearGradient id="${newId}" ${body.replace(/>/, ">\n      ").replace(/\/></g, "/>\n      <")}\n    </linearGradient>`.replace(
        /\n      \n/g,
        "\n",
      ),
    );
    return newId;
  };

  const paint = (value: string, m: Matrix): string => {
    const url = value.match(/^url\(#(.+)\)$/);
    return url ? `url(#${gradient(url[1], m)})` : hex(value);
  };

  const presentation = (
    element: Element,
    m: Matrix,
    outline?: Segment[],
  ): string => {
    const style = parseStyle(element.attrs.get("style"));
    for (const key of PRESENTATION) {
      const attr = element.attrs.get(key);
      if (attr != null && !style.has(key)) style.set(key, attr);
    }
    const parts: string[] = [];
    for (const key of PRESENTATION) {
      const value = style.get(key);
      if (value == null) continue;
      if (key === "fill" || key === "stroke") {
        parts.push(`${key}="${paint(value, m)}"`);
      } else if (key === "stroke-width") {
        const width = parseFloat(value) * strokeScale(m, outline);
        parts.push(`stroke-width="${n(width)}"`);
      } else {
        parts.push(`${key}="${value}"`);
      }
    }
    for (const key of style.keys()) {
      if (!PRESENTATION.includes(key)) {
        throw new Error(`Unhandled style ${key} on <${element.name}>`);
      }
    }
    return parts.length ? " " + parts.join(" ") : "";
  };

  /** An embedded strip of pixels (one color per column), as a gradient across a rect */
  const pixelStrip = (use: Element, m: Matrix): string => {
    const href = use.attrs.get("xlink:href") ?? use.attrs.get("href")!;
    const image = defs.get(href.slice(1))!;
    const data = image.attrs.get("xlink:href") ?? image.attrs.get("href")!;
    const columns = decodePngRow(
      Buffer.from(data.replace(/^data:image\/png;base64,/, ""), "base64"),
    );
    const x = Number(use.attrs.get("x") ?? 0);
    const y = Number(use.attrs.get("y") ?? 0);
    const w = parseFloat(use.attrs.get("width") ?? image.attrs.get("width")!);
    const h = parseFloat(use.attrs.get("height") ?? image.attrs.get("height")!);
    const id = `${options.prefix}gradient-${gradientIds.size + 1}`;
    gradientIds.set(`strip ${id}`, id);
    const [ax, ay] = apply(m, x, y + h / 2);
    const [bx, by] = apply(m, x + w, y + h / 2);
    const stops = columns.flatMap((color, i) => [
      `<stop offset="${n(i / columns.length)}" stop-color="${color}"/>`,
      `<stop offset="${n((i + 1) / columns.length)}" stop-color="${color}"/>`,
    ]);
    outDefs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(ax)}" y1="${n(ay)}" x2="${n(bx)}" y2="${n(by)}">\n      ${dedupeStops(stops).join("\n      ")}\n    </linearGradient>`,
    );
    return shape(rectElement(x, y, w, h), m, `fill="url(#${id})"`);
  };

  const shape = (element: Element, m: Matrix, extra?: string): string => {
    const a = element.attrs;
    const attrsFor = (outline: Segment[]) =>
      extra ? " " + extra : presentation(element, m, outline);
    if (element.name === "rect") {
      const [x, y, w, h] = ["x", "y", "width", "height"].map((k) =>
        parseFloat(a.get(k) ?? "0"),
      );
      const attrs = attrsFor(rectPath(x, y, w, h));
      if (isAxisAligned(m)) {
        const [x1, y1] = apply(m, x, y);
        const [x2, y2] = apply(m, x + w, y + h);
        return (
          `<rect x="${n(Math.min(x1, x2))}" y="${n(Math.min(y1, y2))}" ` +
          `width="${n(Math.abs(x2 - x1))}" height="${n(Math.abs(y2 - y1))}"${attrs}/>`
        );
      }
      return `<path d="${formatPath(rectPath(x, y, w, h), m)}"${attrs}/>`;
    }
    if (element.name === "circle" || element.name === "ellipse") {
      const [cx, cy] = ["cx", "cy"].map((k) => parseFloat(a.get(k) ?? "0"));
      const [r0x, r0y] =
        element.name === "circle"
          ? [parseFloat(a.get("r")!), parseFloat(a.get("r")!)]
          : [parseFloat(a.get("rx")!), parseFloat(a.get("ry")!)];
      const attrs = attrsFor(ellipsePath(cx, cy, r0x, r0y));
      const [x, y] = apply(m, cx, cy);
      if (isAxisAligned(m)) {
        const rx = Math.abs(m[0]) * r0x;
        const ry = Math.abs(m[3]) * r0y;
        return Math.abs(rx - ry) < 1e-3
          ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rx)}"${attrs}/>`
          : `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}"${attrs}/>`;
      }
      return `<path d="${formatPath(ellipsePath(cx, cy, r0x, r0y), m)}"${attrs}/>`;
    }
    if (element.name === "path") {
      const segments = parsePath(a.get("d")!);
      return `<path d="${formatPath(segments, m)}"${attrsFor(segments)}/>`;
    }
    throw new Error(`Unhandled element <${element.name}>`);
  };

  /** Everything under `element`, with `m` its transform to the root's frame */
  const walk = (element: Element, parent: Matrix, depth: number): string[] => {
    if (
      ["defs", "linearGradient", "clipPath", "image"].includes(element.name)
    ) {
      return [];
    }
    const m = multiply(parent, parseTransform(element.attrs.get("transform")));
    if (element.name === "use") {
      return [pixelStrip(element, m)];
    }
    if (element.name !== "g") {
      return [shape(element, m)];
    }
    const children = element.children.flatMap((c) => walk(c, m, depth + 1));
    if (children.length === 0) return [];

    const name = element.attrs.get("serif:id") ?? element.attrs.get("id");
    const clip = element.attrs.get("clip-path")?.match(/^url\(#(.+)\)$/)?.[1];
    const style = presentation(element, m);
    if (!name && !clip && !style) return children;
    let open = "<g";
    if (name) open += ` id="${uniqueName(name)}"`;
    if (clip) {
      const clipPath = defs.get(clip)!;
      const clipId = `${options.prefix}clip-${++clipCount}`;
      const contents = clipPath.children.flatMap((c) => walk(c, m, 0));
      outDefs.push(
        `<clipPath id="${clipId}">\n      ${contents.join("\n      ")}\n    </clipPath>`,
      );
      open += ` clip-path="url(#${clipId})"`;
    }
    open += style + ">";
    return [
      open,
      ...children.map((c) => "  " + c.replace(/\n/g, "\n  ")),
      "</g>",
    ];
  };

  // The root's own size and style
  const [vx, vy, vw, vh] = svg.attrs
    .get("viewBox")!
    .split(/[\s,]+/)
    .map(Number);
  const root = multiply(options.outer, [1, 0, 0, 1, -vx, -vy]);
  let body = svg.children.flatMap((c) => walk(c, root, 0));
  // A lone named group around everything is the drawing itself
  if (body[0]?.startsWith("<g id=") && body[body.length - 1] === "</g>") {
    const closing = body.findIndex((line, i) => i > 0 && line === "</g>");
    if (closing === body.length - 1) {
      body = body.slice(1, -1).map((line) => line.replace(/^ {2}/, ""));
    }
  }
  const rootStyle = presentation(svg, IDENTITY);
  const box = options.viewBox ?? [0, 0, vw, vh];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(box[2])}" height="${n(box[3])}" ` +
    `viewBox="${box.map(n).join(" ")}"${rootStyle}>\n` +
    (outDefs.length
      ? `  <defs>\n    ${outDefs.join("\n    ")}\n  </defs>\n`
      : "") +
    body.map((line) => "  " + line.replace(/\n/g, "\n  ")).join("\n") +
    "\n</svg>\n"
  );
}

function parseStyle(style: string | undefined): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (style ?? "").split(";")) {
    const [key, value] = part.split(":").map((s) => s.trim());
    if (key && value) result.set(key, value);
  }
  return result;
}

function rectElement(x: number, y: number, w: number, h: number): Element {
  return {
    name: "rect",
    attrs: new Map([
      ["x", String(x)],
      ["y", String(y)],
      ["width", String(w)],
      ["height", String(h)],
    ]),
    children: [],
  };
}

/** Neighboring columns of the same color as one band */
function dedupeStops(stops: string[]): string[] {
  const color = (stop: string) => stop.match(/stop-color="([^"]+)"/)![1];
  return stops.filter(
    (stop, i) =>
      i === 0 ||
      i === stops.length - 1 ||
      !(
        color(stops[i - 1]) === color(stop) &&
        color(stops[i + 1]) === color(stop)
      ),
  );
}

/** The first row of an RGBA PNG's pixels, as colors (every row has to be the same) */
function decodePngRow(png: Buffer): string[] {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (png[24] !== 8 || png[25] !== 6) {
    throw new Error("Only 8-bit RGBA PNGs are handled");
  }
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    const type = png.toString("ascii", at + 4, at + 8);
    if (type === "IDAT") chunks.push(png.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  let previous = Buffer.alloc(stride);
  const rows: string[][] = [];
  for (let r = 0; r < height; r++) {
    const filter = raw[r * (stride + 1)];
    const line = Buffer.from(
      raw.subarray(r * (stride + 1) + 1, (r + 1) * (stride + 1)),
    );
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? line[x - 4] : 0;
      const b = previous[x];
      const c = x >= 4 ? previous[x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const [pa, pb, pc] = [
          Math.abs(p - a),
          Math.abs(p - b),
          Math.abs(p - c),
        ];
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + predictor) & 255;
    }
    const colors: string[] = [];
    for (let x = 0; x < width; x++) {
      if (line[x * 4 + 3] !== 255)
        throw new Error("Only opaque strips are handled");
      colors.push(
        "#" +
          [0, 1, 2]
            .map((i) => line[x * 4 + i].toString(16).padStart(2, "0"))
            .join(""),
      );
    }
    rows.push(colors);
    previous = line;
  }
  if (rows.some((row) => row.join() !== rows[0].join())) {
    throw new Error("Only strips whose rows are all alike are handled");
  }
  return rows[0];
}

function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => {
    const i = args.indexOf(`--${name}`);
    if (i < 0) return undefined;
    const [value] = args.splice(i, 2).slice(1);
    return value;
  };
  const out = option("out");
  const origin = option("origin");
  const scale = Number(option("scale") ?? 1);
  if (!out || args.length === 0) {
    throw new Error(
      "Usage: clean-svg.ts --out <folder> [--origin X,Y|center --scale S] <file.svg>...",
    );
  }
  fs.mkdirSync(out, { recursive: true });
  for (const input of args) {
    const text = fs.readFileSync(input, "utf8");
    const name = path.basename(input, ".svg");
    let outer = IDENTITY;
    let viewBox: Options["viewBox"] = null;
    if (origin) {
      const [, , w, h] = parseXml(text)
        .attrs.get("viewBox")!
        .split(/[\s,]+/)
        .map(Number);
      const [ox, oy] =
        origin === "center" ? [w / 2, h / 2] : origin.split(",").map(Number);
      outer = [scale, 0, 0, scale, -ox * scale, -oy * scale];
      viewBox = [-ox * scale, -oy * scale, w * scale, h * scale];
    }
    const output = path.join(out, `${name}.svg`);
    fs.writeFileSync(
      output,
      cleanSvg(text, { prefix: `${name.toLowerCase()}-`, outer, viewBox }),
    );
    console.log(`${input} → ${output}`);
  }
}

main();
