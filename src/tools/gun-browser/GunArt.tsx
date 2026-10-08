import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { RESOURCES } from "../../../resources/resources";
import { POINT_COLORS } from "../../highrise/rig/RigOverlay";
import { gunArtSvg } from "../../highrise/weapons/guns/gunArt";
import {
  GunPartName,
  GunPointName,
  movePoint,
  PartAmounts,
  PartStroke,
} from "../../highrise/weapons/guns/GunPose";
import { GunStats } from "../../highrise/weapons/guns/GunStats";

/*
 * A gun's two drawings at true scale: its pickup (the side view, as it lies
 * on the floor and in the store) over its top view (as it's held), lined up
 * on the gun's origin, which both are drawn about in millimeters. The top
 * view marks the gun's points and muzzle, and moves its parts through their
 * strokes.
 */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const POINT_NAMES: Record<GunPointName, string> = {
  grip: "Grip: the hand that pulls the trigger",
  foregrip: "Foregrip: the support hand",
  magazine: "Magazine: where it goes in",
  action: "Action: the slide, bolt, pump or handle a hand works",
};

function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function viewBoxOf(svg: Element): Box {
  const [x, y, width, height] = (svg.getAttribute("viewBox") ?? "0 0 0 0")
    .split(/[\s,]+/)
    .map(Number);
  return { x, y, width, height };
}

/** The transform that moves a part `amount` of its stroke, in millimeters */
function partTransform(stroke: PartStroke, amount: number): string {
  const [px, py] = (stroke.pivot ?? [0, 0]).map((m) => m * 1000);
  const [ox, oy] = (stroke.offset ?? [0, 0]).map((m) => m * 1000 * amount);
  const degrees = ((stroke.angle ?? 0) * amount * 180) / Math.PI;
  const stretch = 1 + ((stroke.stretch ?? 1) - 1) * amount;
  return (
    `translate(${ox} ${oy}) translate(${px} ${py}) rotate(${degrees}) ` +
    `scale(${stretch} 1) translate(${-px} ${-py})`
  );
}

/** Where a point is with the parts that carry it moved */
function pointWithParts(
  gun: GunStats,
  name: GunPointName,
  parts: PartAmounts,
): [number, number] {
  let point: [number, number] = [...gun.points[name]];
  for (const [part, stroke] of Object.entries(gun.parts ?? {})) {
    const amount = parts[part as GunPartName] ?? 0;
    if (amount !== 0 && stroke.carries?.includes(name)) {
      const moved = movePoint(stroke, amount, point);
      point = [moved.x, moved.y];
    }
  }
  return point;
}

/** The top view's SVG with its parts moved and its points marked */
function topViewSvg(
  gun: GunStats,
  parts: PartAmounts,
  points: boolean,
  mmPerPixel: number,
): { svg: string; box: Box } {
  const doc = new DOMParser().parseFromString(
    gunArtSvg(gun.art),
    "image/svg+xml",
  );
  const root = doc.documentElement;
  const box = viewBoxOf(root);
  for (const [name, stroke] of Object.entries(gun.parts ?? {})) {
    const amount = parts[name as GunPartName] ?? 0;
    const group = [...root.children].find((child) => child.id === name);
    if (group && amount !== 0) {
      group.setAttribute("transform", partTransform(stroke, amount));
    }
  }
  if (points) {
    const ns = "http://www.w3.org/2000/svg";
    const marks = doc.createElementNS(ns, "g");
    const radius = 4 * mmPerPixel;
    const mark = (
      [x, y]: [number, number],
      color: number,
      tip: string,
      r = radius,
    ) => {
      const circle = doc.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(x * 1000));
      circle.setAttribute("cy", String(y * 1000));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", cssColor(color));
      circle.setAttribute("stroke", "#000");
      circle.setAttribute("stroke-width", String(mmPerPixel));
      circle.setAttribute("data-tip", tip);
      marks.append(circle);
    };
    for (const name of Object.keys(gun.points) as GunPointName[]) {
      const at = pointWithParts(gun, name, parts);
      mark(
        at,
        POINT_COLORS[name],
        `${POINT_NAMES[name]} (${at.map((m) => Math.round(m * 1000)).join(", ")} mm)`,
      );
    }
    mark(
      [gun.muzzleLength, 0],
      POINT_COLORS.muzzle,
      `Muzzle: where bullets and the flash start (${Math.round(gun.muzzleLength * 1000)} mm)`,
      radius * 0.75,
    );
    // Room for the marks past the ends
    box.x = Math.min(box.x, gun.muzzleLength * 1000 - radius * 2);
    box.width =
      Math.max(box.x + box.width, gun.muzzleLength * 1000 + radius * 2) - box.x;
    root.setAttribute(
      "viewBox",
      `${box.x} ${box.y} ${box.width} ${box.height}`,
    );
    root.append(marks);
  }
  root.setAttribute("width", String(box.width / mmPerPixel));
  root.setAttribute("height", String(box.height / mmPerPixel));
  return { svg: new XMLSerializer().serializeToString(root), box };
}

const pickupCache = new Map<string, Promise<string>>();

/** A pickup's SVG text */
function fetchPickup(url: string): Promise<string> {
  let text = pickupCache.get(url);
  if (!text) {
    text = fetch(url).then((response) => response.text());
    pickupCache.set(url, text);
  }
  return text;
}

/**
 * The pickup, cropped to what's drawn in its square: `onMeasure` is told
 * where that is, in millimeters
 */
function Pickup({
  gun,
  scale,
  left,
  onMeasure,
}: {
  gun: GunStats;
  scale: number;
  left: number;
  onMeasure: (box: Box) => void;
}) {
  const url = RESOURCES.images[gun.textures.pickup];
  const [svg, setSvg] = useState<string>();
  const [box, setBox] = useState<Box>();
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let current = true;
    setBox(undefined);
    fetchPickup(url).then((text) => current && setSvg(text));
    return () => {
      current = false;
    };
  }, [url]);
  useLayoutEffect(() => {
    const element = holder.current?.querySelector("svg");
    if (!element || box) {
      return;
    }
    const measured = element.getBBox();
    const crop = {
      x: measured.x,
      y: measured.y,
      width: measured.width,
      height: measured.height,
    };
    setBox(crop);
    onMeasure(crop);
  }, [svg, box]);
  useLayoutEffect(() => {
    const element = holder.current?.querySelector("svg");
    if (element && box) {
      element.setAttribute(
        "viewBox",
        `${box.x} ${box.y} ${box.width} ${box.height}`,
      );
      element.setAttribute("width", String(box.width * scale));
      element.setAttribute("height", String(box.height * scale));
    }
  });
  return (
    <div
      ref={holder}
      class="drawing"
      style={{
        marginLeft: box ? (box.x - left) * scale : 0,
        visibility: box ? "visible" : "hidden",
      }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

/** A bar `mm` long, marked every centimeter */
function Ruler({ scale, mm = 100 }: { scale: number; mm?: number }) {
  const ticks = [];
  for (let i = 0; i <= mm; i += 10) {
    const x = i * scale;
    ticks.push(
      <line
        key={i}
        x1={x}
        x2={x}
        y1={i % 50 === 0 ? 0 : 4}
        y2={10}
        stroke="currentColor"
      />,
    );
  }
  return (
    <div class="ruler muted small">
      <svg width={mm * scale + 1} height={11} style={{ overflow: "visible" }}>
        {ticks}
        <line x1={0} x2={mm * scale} y1={10} y2={10} stroke="currentColor" />
      </svg>
      <span>{mm / 10} cm</span>
    </div>
  );
}

/** Pixels per millimeter to pick from */
export const SCALES = [0.5, 1, 1.5, 2, 3];

/**
 * The guns' drawings, each pickup over its top view, all at one scale and
 * lined up on their origins
 */
export function GunDrawings({
  guns,
  scale,
  points,
  parts,
}: {
  guns: GunStats[];
  /** Pixels per millimeter */
  scale: number;
  points: boolean;
  /** How far through its stroke each part of the first gun is */
  parts: PartAmounts;
}) {
  const [pickupBoxes, setPickupBoxes] = useState<Record<string, Box>>({});
  const tops = guns.map((gun, i) =>
    topViewSvg(gun, i === 0 ? parts : {}, points, 1 / scale),
  );
  // Where the leftmost drawing starts, in millimeters from the origin
  const left = Math.min(
    ...tops.map(({ box }) => box.x),
    ...guns.map((gun) => pickupBoxes[gun.name]?.x ?? 0),
  );
  return (
    <div class="drawings">
      {guns.map((gun, i) => (
        <div key={gun.name} class="drawings__gun">
          {guns.length > 1 && <h3 class="drawings__name">{gun.name}</h3>}
          <div class="drawings__label muted small">Pickup, from the side</div>
          <Pickup
            gun={gun}
            scale={scale}
            left={left}
            onMeasure={(box) =>
              setPickupBoxes((boxes) => ({ ...boxes, [gun.name]: box }))
            }
          />
          <div class="drawings__label muted small">Held, from above</div>
          <div
            class="drawing"
            style={{ marginLeft: (tops[i].box.x - left) * scale }}
            dangerouslySetInnerHTML={{ __html: tops[i].svg }}
          />
        </div>
      ))}
      <Ruler scale={scale} />
    </div>
  );
}

/** The point colors, for a legend */
export function PointLegend() {
  return (
    <div class="legend small">
      {(Object.keys(POINT_NAMES) as GunPointName[]).map((name) => (
        <span key={name} data-tip={POINT_NAMES[name]}>
          <i style={{ background: cssColor(POINT_COLORS[name]) }} />
          {name}
        </span>
      ))}
      <span data-tip="Where bullets and the muzzle flash start">
        <i style={{ background: cssColor(POINT_COLORS.muzzle) }} />
        muzzle
      </span>
    </div>
  );
}
