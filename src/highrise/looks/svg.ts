import { Color, darken, withAlpha } from "./color";
import { STYLE } from "./style";

/** A point in millimeters, which is what the generator draws in */
export type Pt = [number, number];

/** A number for an SVG attribute: short, and never `1e-7` */
export function n(value: number): string {
  return String(Math.round(value * 10) / 10);
}

export function ptsAttr(points: Pt[]): string {
  return points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
}

/** A closed path through `points` with straight sides */
export function polygonPath(points: Pt[]): string {
  return `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;
}

/**
 * A smooth path through every one of `points` (Catmull-Rom, as Béziers),
 * closed unless `closed` is false. `tension` 1 is the usual curve, 0 straight.
 */
export function smoothPath(points: Pt[], closed = true, tension = 1): string {
  const count = points.length;
  if (count < 3) {
    return polygonPath(points);
  }
  const at = (i: number): Pt =>
    closed
      ? points[(i + count) % count]
      : points[Math.max(0, Math.min(count - 1, i))];
  const k = tension / 6;
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  const segments = closed ? count : count - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

/** Points round an ellipse, starting in front (+x), each pushed out by `bump(angle)` */
export function ellipsePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  bump: (angle: number) => number = () => 0,
): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const scale = 1 + bump(angle);
    points.push([
      cx + Math.cos(angle) * rx * scale,
      cy + Math.sin(angle) * ry * scale,
    ]);
  }
  return points;
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return (
    `M${n(cx + rx)} ${n(cy)}` +
    `A${n(rx)} ${n(ry)} 0 1 1 ${n(cx - rx)} ${n(cy)}` +
    `A${n(rx)} ${n(ry)} 0 1 1 ${n(cx + rx)} ${n(cy)}Z`
  );
}

/** A rectangle with round ends, `x0` to `x1` along x and `thickness` across */
export function capsulePath(
  x0: number,
  x1: number,
  y: number,
  thickness: number,
) {
  const r = thickness / 2;
  return (
    `M${n(x0 + r)} ${n(y - r)}L${n(x1 - r)} ${n(y - r)}` +
    `A${n(r)} ${n(r)} 0 0 1 ${n(x1 - r)} ${n(y + r)}` +
    `L${n(x0 + r)} ${n(y + r)}` +
    `A${n(r)} ${n(r)} 0 0 1 ${n(x0 + r)} ${n(y - r)}Z`
  );
}

export type Shade = "dome" | "tube" | "flat";

export interface BlobOptions {
  /** How it's lit: a dome is brightest in the middle, a tube along its length */
  shade?: Shade;
  /** The outline's width in mm, 0 for none */
  outline?: number;
  /** Its own outline color, else the fill darkened */
  outlineColor?: Color;
  /** Blotchy rot over it */
  grain?: "rot";
  /** Drawn only inside this clip path's id */
  clip?: string;
  opacity?: number;
}

/**
 * One part being drawn: a box in millimeters around its own origin, and
 * what's in it. Ids are given a prefix so parts can share a document.
 */
export class Drawing {
  private defs: string[] = [];
  private body: string[] = [];
  private madeDefs = new Set<string>();

  constructor(
    readonly prefix: string,
    public minX: number,
    public minY: number,
    public maxX: number,
    public maxY: number,
  ) {}

  get width() {
    return this.maxX - this.minX;
  }
  get height() {
    return this.maxY - this.minY;
  }

  /** Makes the box big enough for this, plus room for an outline */
  include(minX: number, minY: number, maxX: number, maxY: number) {
    const margin = STYLE.outline;
    this.minX = Math.min(this.minX, minX - margin);
    this.minY = Math.min(this.minY, minY - margin);
    this.maxX = Math.max(this.maxX, maxX + margin);
    this.maxY = Math.max(this.maxY, maxY + margin);
  }

  /** Makes the box big enough for all of `points` */
  includePoints(points: Pt[]) {
    for (const [x, y] of points) {
      this.include(x, y, x, y);
    }
  }

  id(name: string): string {
    return `${this.prefix}-${name}`;
  }

  /** Adds a definition once, under `name`, and gives its id */
  def(name: string, make: (id: string) => string): string {
    const id = this.id(name);
    if (!this.madeDefs.has(id)) {
      this.madeDefs.add(id);
      this.defs.push(make(id));
    }
    return id;
  }

  add(element: string) {
    this.body.push(element);
  }

  /** Starts a group; everything added until `end` goes in it */
  begin(attributes: string) {
    this.body.push(`<g ${attributes}>`);
  }
  end() {
    this.body.push("</g>");
  }

  /** A clip path of `d`, by its id */
  clipPath(name: string, d: string): string {
    return this.def(
      name,
      (id) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`,
    );
  }

  /** A filled shape with the house shading and outline */
  blob(d: string, fill: Color, options: BlobOptions = {}) {
    const {
      shade = "dome",
      outline = STYLE.outline,
      grain,
      clip,
      opacity,
    } = options;
    const groupAttrs = [
      clip ? `clip-path="url(#${clip})"` : "",
      opacity !== undefined ? `opacity="${n(opacity)}"` : "",
    ].join(" ");
    if (groupAttrs.trim()) {
      this.begin(groupAttrs);
    }
    if (grain) {
      this.add(
        `<path d="${d}" fill="${fill}" filter="url(#${this.grainFilter(grain)})"/>`,
      );
    } else {
      this.add(`<path d="${d}" fill="${fill}"/>`);
    }
    if (shade !== "flat") {
      this.add(`<path d="${d}" fill="url(#${this.shadeGradient(shade)})"/>`);
    }
    if (outline > 0) {
      const color = options.outlineColor ?? darken(fill, STYLE.outlineDarken);
      this.add(
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(outline)}" stroke-linejoin="round"/>`,
      );
    }
    if (groupAttrs.trim()) {
      this.end();
    }
  }

  /** A line, `color` or a darker shade of it */
  line(d: string, color: string, width: number, extra = "") {
    this.add(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`,
    );
  }

  shadeGradient(shade: "dome" | "tube"): string {
    const { highlight, shadow } = STYLE;
    if (shade === "dome") {
      return this.def(
        "dome",
        (id) =>
          `<radialGradient id="${id}" cx="0.45" cy="0.42" r="0.62">` +
          `<stop offset="0" stop-color="#fff" stop-opacity="${highlight}"/>` +
          `<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>` +
          `<stop offset="0.8" stop-color="#000" stop-opacity="${shadow * 0.4}"/>` +
          `<stop offset="1" stop-color="#000" stop-opacity="${shadow}"/>` +
          `</radialGradient>`,
      );
    }
    return this.def(
      "tube",
      (id) =>
        `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#000" stop-opacity="${shadow * 0.7}"/>` +
        `<stop offset="0.35" stop-color="#fff" stop-opacity="${highlight}"/>` +
        `<stop offset="0.6" stop-color="#fff" stop-opacity="0"/>` +
        `<stop offset="1" stop-color="#000" stop-opacity="${shadow}"/>` +
        `</linearGradient>`,
    );
  }

  /** A filter that multiplies blotchy noise into what it's on, for rot */
  grainFilter(grain: "rot"): string {
    const settings = STYLE[grain];
    return this.def(
      `grain-${grain}`,
      (id) =>
        `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${settings.frequency}" numOctaves="${settings.octaves}" seed="${settings.seed}"/>` +
        `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-settings.strength * 2} 0 0 0 ${settings.strength}"/>` +
        `<feComposite in2="SourceGraphic" operator="in"/>` +
        `<feBlend in2="SourceGraphic" mode="multiply"/>` +
        `</filter>`,
    );
  }

  /** The finished drawing as the inside of an `<svg>` */
  content(): string {
    return `<defs>${this.defs.join("")}</defs>${this.body.join("")}`;
  }

  /** As a document of its own, `pixelsPerMeter` big */
  toSvg(pixelsPerMeter: number): string {
    const scale = pixelsPerMeter / 1000;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${n(this.width * scale)}" height="${n(this.height * scale)}" ` +
      `viewBox="${n(this.minX)} ${n(this.minY)} ${n(this.width)} ${n(this.height)}">${this.content()}</svg>`
    );
  }
}

/** Translucent `color`, for stains and smudges */
export function stain(color: Color, alpha: number) {
  return withAlpha(color, alpha);
}
