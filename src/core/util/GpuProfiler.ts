import { Container, RenderContainer } from "pixi.js";
import { profiler } from "./Profiler";

/**
 * Times sections of the GPU's work with WebGL timer queries
 * (`EXT_disjoint_timer_query_webgl2`), the GPU's side of `Profiler`: how long
 * the GPU spent carrying out the draw calls made inside each section.
 *
 * Usage, around code that draws:
 *   gpuProfiler.measure("LightingManager", () => { ... });
 *
 * Sections nest like the CPU profiler's, with labels joined by " > ". WebGL
 * only lets one timer query run at a time, so nesting is done by splitting
 * the GPU's timeline: whenever a section starts or ends, the running query
 * ends and a new one starts, charged to the innermost section open at the
 * time. Each section's own time (`selfMs`) is what its queries measured; its
 * total (`msPerFrame`) adds its children's.
 *
 * What a query measures is the time from the GPU reaching its start to
 * reaching its end, which includes the GPU sitting idle while the CPU is
 * still working out the next draw call, so it's an upper bound. And
 * splitting the timeline costs something: in Chrome on a Mac (ANGLE over
 * Metal), each split added about a quarter of a millisecond, and passes the
 * GPU ran overlapped got counted twice, so at 32 fires the sections added up
 * to 17 ms against 7 ms for the whole render timed alone. So, like the CPU
 * profiler's per-entity detail, sections are for comparing with each other:
 * for a real total, time only the top level (`maxDepth = 1`).
 *
 * Results come back a few frames later, and are collected (`poll`) at the
 * start of each frame. If the GPU was interrupted (the "disjoint" flag, say
 * from power management), the results in flight are thrown away. It only
 * does anything while `enabled`, since every query is a few more calls into
 * WebGL, and where the extension is missing it never does anything.
 */
class GpuProfiler {
  private gl?: WebGL2RenderingContext;
  private ext?: {
    TIME_ELAPSED_EXT: number;
    GPU_DISJOINT_EXT: number;
  };
  /** Whether to time anything; turn on to look at the numbers */
  enabled = false;
  /** How deep sections are timed; deeper ones count toward their parent */
  maxDepth = Infinity;

  /** The sections open now, innermost last, as full labels */
  private stack: string[] = [];
  private running?: { query: WebGLQuery; label: string };
  /** Queries sent off and not back yet, oldest first */
  private pending: { query: WebGLQuery; label: string; frame: number }[] = [];
  private spareQueries: WebGLQuery[] = [];
  private frame = 0;

  /** Per label, own time (not children's): smoothed and captured */
  private entries = new Map<
    string,
    { smoothedMs: number; frameMs: number; captureMs: number }
  >();
  /** Frames whose results have all come back since the last smoothing */
  private lastCompleteFrame = 0;
  private capturing = false;
  private captureFrames = 0;
  private captureStartFrame = 0;

  private readonly smoothing = 0.95;
  private readonly separator = " > ";

  /** Whether the GPU can be timed here */
  get available(): boolean {
    return this.ext !== undefined;
  }

  /** Call once with the renderer's context */
  init(gl: WebGL2RenderingContext | undefined) {
    this.gl = gl;
    this.ext = gl?.getExtension("EXT_disjoint_timer_query_webgl2") ?? undefined;
  }

  private get active(): boolean {
    return this.enabled && this.ext !== undefined;
  }

  /** Time the GPU work of the draw calls `fn` makes */
  measure<T>(label: string, fn: () => T): T {
    if (!this.active) {
      return fn();
    }
    this.start(label);
    try {
      return fn();
    } finally {
      this.end();
    }
  }

  start(label: string) {
    if (!this.active) {
      return;
    }
    const parent = this.stack[this.stack.length - 1];
    const full = parent ? parent + this.separator + label : label;
    this.stack.push(full);
    if (this.stack.length <= this.maxDepth) {
      this.switchTo(full);
    }
  }

  end() {
    if (!this.active || this.stack.length === 0) {
      return;
    }
    const depth = this.stack.length;
    this.stack.pop();
    if (depth <= this.maxDepth) {
      this.switchTo(this.stack[this.stack.length - 1]);
    }
  }

  /** Ends the running query and starts one for `label`, if any */
  private switchTo(label: string | undefined) {
    const gl = this.gl!;
    if (this.running) {
      gl.endQuery(this.ext!.TIME_ELAPSED_EXT);
      this.pending.push({ ...this.running, frame: this.frame });
      this.running = undefined;
    }
    if (label !== undefined) {
      const query = this.spareQueries.pop() ?? gl.createQuery()!;
      gl.beginQuery(this.ext!.TIME_ELAPSED_EXT, query);
      this.running = { query, label };
    }
  }

  /** Call at the start of each frame: collects the results that are back */
  poll() {
    this.frame += 1;
    if (this.ext === undefined) {
      return;
    }
    const gl = this.gl!;
    if (this.pending.length > 0 && gl.getParameter(this.ext.GPU_DISJOINT_EXT)) {
      // Timings in flight can't be trusted
      for (const { query } of this.pending) {
        this.spareQueries.push(query);
      }
      this.pending = [];
      return;
    }
    while (this.pending.length > 0) {
      const { query, label, frame } = this.pending[0];
      if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
        break;
      }
      this.pending.shift();
      // Results come back in order, so every frame before this one is complete
      this.completeFramesBefore(frame);
      const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
      this.spareQueries.push(query);
      this.entry(label).frameMs += ms;
    }
    if (this.pending.length === 0) {
      // Everything sent off before this frame is back
      this.completeFramesBefore(this.frame);
    }
  }

  /** Smooths (and captures) each frame from `lastCompleteFrame` up to `frame` */
  private completeFramesBefore(frame: number) {
    while (this.lastCompleteFrame < frame - 1) {
      this.lastCompleteFrame += 1;
      const counts =
        this.capturing && this.lastCompleteFrame >= this.captureStartFrame;
      if (counts) {
        this.captureFrames += 1;
      }
      for (const entry of this.entries.values()) {
        entry.smoothedMs =
          this.smoothing * entry.smoothedMs +
          (1 - this.smoothing) * entry.frameMs;
        if (counts) {
          entry.captureMs += entry.frameMs;
        }
        entry.frameMs = 0;
      }
    }
  }

  private entry(label: string) {
    let entry = this.entries.get(label);
    if (!entry) {
      entry = { smoothedMs: 0, frameMs: 0, captureMs: 0 };
      this.entries.set(label, entry);
    }
    return entry;
  }

  /** Start averaging exactly, like `Profiler.startCapture` (turns timing on) */
  startCapture() {
    this.enabled = true;
    this.capturing = true;
    this.captureFrames = 0;
    this.captureStartFrame = this.frame + 1;
    for (const entry of this.entries.values()) {
      entry.captureMs = 0;
    }
  }

  /** Stop and return ms per frame for each section, own and with children */
  stopCapture(): GpuReport {
    this.capturing = false;
    const frames = Math.max(this.captureFrames, 1);
    return {
      available: this.available,
      frames: this.captureFrames,
      stats: this.statsFrom((entry) => entry.captureMs / frames),
    };
  }

  /** The smoothed numbers, for the stats overlay */
  getStats(): GpuStats[] {
    return this.statsFrom((entry) => entry.smoothedMs);
  }

  /** Depth first, children sorted by total time */
  private statsFrom(
    ms: (entry: { smoothedMs: number; captureMs: number }) => number,
  ): GpuStats[] {
    const totals = new Map<string, number>();
    for (const [label, entry] of this.entries) {
      const own = ms(entry);
      // Charge it to the section and every section it's in
      const parts = label.split(this.separator);
      for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join(this.separator);
        totals.set(path, (totals.get(path) ?? 0) + own);
      }
    }
    const children = new Map<string, string[]>();
    for (const label of totals.keys()) {
      const parent = label
        .split(this.separator)
        .slice(0, -1)
        .join(this.separator);
      const list = children.get(parent) ?? [];
      list.push(label);
      children.set(parent, list);
    }
    const result: GpuStats[] = [];
    const visit = (parent: string) => {
      const list = (children.get(parent) ?? []).sort(
        (a, b) => totals.get(b)! - totals.get(a)!,
      );
      for (const label of list) {
        const entry = this.entries.get(label);
        const depth = label.split(this.separator).length - 1;
        result.push({
          label,
          shortLabel: label.split(this.separator)[depth],
          depth,
          msPerFrame: totals.get(label)!,
          selfMs: entry ? ms(entry) : 0,
        });
        visit(label);
      }
    };
    visit("");
    return result;
  }

  reset() {
    this.entries.clear();
  }
}

export interface GpuStats {
  label: string;
  shortLabel: string;
  depth: number;
  /** GPU ms per frame, children included */
  msPerFrame: number;
  /** GPU ms per frame outside any child section */
  selfMs: number;
}

export interface GpuReport {
  /** False where the browser can't time the GPU (then there are no stats) */
  available: boolean;
  frames: number;
  stats: GpuStats[];
}

export const gpuProfiler = new GpuProfiler();

/** Times a section on both the CPU (`profiler`) and the GPU, under one label */
export function measureCpuAndGpu<T>(label: string, fn: () => T): T {
  return profiler.measure(label, () => gpuProfiler.measure(label, fn));
}

/**
 * `content` in a container that times its drawing on the GPU, under `label`,
 * nested in whatever section is drawing it (usually `Renderer.render`).
 * Drawing the stage is one call, so its parts can't be timed from outside;
 * instead a `RenderContainer` on either side of `content` starts and ends
 * the section as the GPU's commands are sent, in drawing order. They break
 * Pixi's batching, so whatever is batched with `content` (sprites before or
 * after it) is drawn separately. Use the container in place of `content`
 * (its layer, its parent).
 */
export function gpuTimed(label: string, content: Container): Container {
  const container = new Container();
  container.addChild(
    new RenderContainer({ render: () => gpuProfiler.start(label) }),
    content,
    new RenderContainer({ render: () => gpuProfiler.end() }),
  );
  return container;
}
