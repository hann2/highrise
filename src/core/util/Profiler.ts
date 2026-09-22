import { lerp } from "./MathUtil";

interface ProfileEntry {
  // Per-frame accumulators (reset each frame)
  frameCalls: number;
  frameMs: number;

  // Totals since startCapture() (only accumulated while capturing)
  captureCalls: number;
  captureMs: number;

  // Smoothed per-frame values (for display)
  smoothedCallsPerFrame: number;
  smoothedMsPerFrame: number;

  // Other fields
  maxMs: number;
  startTime?: number;
}

export interface ProfileStats {
  label: string;
  shortLabel: string;
  depth: number;
  callsPerFrame: number;
  msPerFrame: number;
  maxMs: number;
}

/** Exact averages over a capture window, for automated comparisons */
export interface CaptureStats {
  label: string;
  depth: number;
  /** Total ms spent in this section over the whole capture */
  totalMs: number;
  msPerFrame: number;
  callsPerFrame: number;
  maxMs: number;
}

export interface CaptureReport {
  frames: number;
  /** Depth-first, children sorted by time, like getStats() */
  stats: CaptureStats[];
}

/**
 * Simple profiler for measuring code performance.
 *
 * Usage:
 *   profiler.start("myFunction");
 *   // ... code to measure ...
 *   profiler.end("myFunction");
 *
 *   // Or use measure() for cleaner code:
 *   profiler.measure("myFunction", () => { ... });
 *
 *   // Just count calls without timing:
 *   profiler.count("frequentOperation");
 *
 *   // View results:
 *   profiler.report();
 *   profiler.reset();
 */
class Profiler {
  private entries = new Map<string, ProfileEntry>();
  private enabled = true;

  /**
   * Whether the game loop should also time every entity's handlers (grouped
   * by class). Costs a couple of performance.now() calls per entity per tick,
   * so it's off unless someone is looking at the numbers.
   */
  entityDetail = false;

  private capturing = false;
  private captureFrames = 0;

  // Stack tracking
  private stack: string[] = [];
  private pathCache = new Map<string, string>();
  private readonly separator = " > ";
  private readonly maxStackDepth = 10;

  // Scope system - registered top-level labels that trigger per-frame processing
  private scopes = new Map<string, { onEnd?: () => void }>();

  // Smoothing factor (higher = smoother, slower to respond)
  private readonly smoothing = 0.975;

  // Stats caching - invalidated each frame
  private cachedStats: ProfileStats[] | null = null;
  private cachedStatsParams: { maxChildren?: number; scope?: string } | null =
    null;

  /** Get the current stack as a path string (cached) */
  private getCurrentPath(): string {
    if (this.stack.length === 0) return "";
    const cacheKey = this.stack.join("\0");
    let path = this.pathCache.get(cacheKey);
    if (!path) {
      path = this.stack.join(this.separator);
      this.pathCache.set(cacheKey, path);
    }
    return path;
  }

  /** Get the entry key for a label using current stack context */
  private getEntryKey(label: string): string {
    const currentPath = this.getCurrentPath();
    if (currentPath === "") return label;
    const cacheKey = currentPath + "\0" + label;
    let fullPath = this.pathCache.get(cacheKey);
    if (!fullPath) {
      fullPath = currentPath + this.separator + label;
      this.pathCache.set(cacheKey, fullPath);
    }
    return fullPath;
  }

  /** Register a label as a scope root. When end() fires for this label at stack depth 0,
   *  only entries nested under it get EMA-smoothed and reset. */
  registerScope(label: string, onEnd?: () => void): void {
    this.scopes.set(label, { onEnd });
  }

  /** Start timing a labeled section */
  start(label: string, options?: { scope?: boolean }): void {
    if (!this.enabled) return;
    if (this.stack.length >= this.maxStackDepth) {
      console.warn(
        `Profiler: max stack depth (${this.maxStackDepth}) exceeded, ignoring: ${label}`,
      );
      return;
    }
    const entryKey = this.getEntryKey(label);
    const entry = this.getOrCreate(entryKey);
    entry.startTime = performance.now();
    this.stack.push(label);

    // Inline scope registration
    if (options?.scope && !this.scopes.has(entryKey)) {
      this.scopes.set(entryKey, {});
    }
  }

  /** End timing a labeled section. Optionally pass explicit elapsed time. */
  end(label: string, explicitElapsedMs?: number): void {
    if (!this.enabled) return;
    if (this.stack.length === 0) {
      console.warn(`Profiler: end("${label}") called with empty stack`);
      return;
    }
    const expectedLabel = this.stack[this.stack.length - 1];
    if (expectedLabel !== label) {
      console.warn(
        `Profiler: mismatched end - expected "${expectedLabel}", got "${label}"`,
      );
      return;
    }
    // Pop the stack to restore parent context
    this.stack.pop();
    // Get the entry key (now with the label as child of current stack)
    const entryKey = this.getEntryKey(label);
    const entry = this.entries.get(entryKey);
    if (!entry) return;

    const elapsed =
      explicitElapsedMs !== undefined
        ? explicitElapsedMs
        : entry.startTime !== undefined
          ? performance.now() - entry.startTime
          : 0;
    entry.frameCalls++;
    entry.frameMs += elapsed;
    entry.maxMs = Math.max(entry.maxMs, elapsed);
    entry.startTime = undefined;

    // Trigger scope processing when a registered scope label ends at root
    if (this.stack.length === 0 && this.scopes.has(label)) {
      this.processScope(label);
    }
  }

  /** Process end of a scope - update smoothed values and reset accumulators for entries under this scope */
  private processScope(scopeLabel: string): void {
    this.cachedStats = null;
    this.cachedStatsParams = null;

    const prefix = scopeLabel + this.separator;
    if (this.capturing) {
      this.captureFrames++;
    }
    for (const [key, entry] of this.entries) {
      if (key === scopeLabel || key.startsWith(prefix)) {
        if (this.capturing) {
          entry.captureCalls += entry.frameCalls;
          entry.captureMs += entry.frameMs;
        }
        entry.smoothedCallsPerFrame = this.smoothedUpdate(
          entry.frameCalls,
          entry.smoothedCallsPerFrame,
        );
        entry.smoothedMsPerFrame = this.smoothedUpdate(
          entry.frameMs,
          entry.smoothedMsPerFrame,
        );
        entry.frameCalls = 0;
        entry.frameMs = 0;
      }
    }

    // Fire scope callback
    this.scopes.get(scopeLabel)?.onEnd?.();
  }

  /** EMA update with cold-start fix: initialize directly on first sample */
  private smoothedUpdate(raw: number, smoothed: number): number {
    if (smoothed === 0 && raw > 0) {
      return raw;
    }
    return lerp(raw, smoothed, this.smoothing);
  }

  /** Measure a function's execution time */
  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      // Detect Promise and attach timing cleanup
      if (result instanceof Promise) {
        return result.finally(() => this.end(label)) as T;
      } else {
        this.end(label);
        return result;
      }
    } catch (err) {
      this.end(label);
      throw err;
    }
  }

  /** Just count occurrences (no timing overhead) */
  count(label: string, amount: number = 1): void {
    if (!this.enabled) return;
    const entryKey = this.getEntryKey(label);
    const entry = this.getOrCreate(entryKey);
    entry.frameCalls += amount;
  }

  /**
   * Record an elapsed time atomically (start + end in one call).
   * Safe for parallel async operations since it doesn't span an async gap.
   * The entry will be nested under the current stack context.
   *
   * `count` lets callers bump the frame-call counter by more than 1 —
   * useful for batched work where the interesting "unit" is a work item
   * (e.g. equations solved) rather than a function call. With a non-1
   * count, the displayed `calls/frame` represents the total work items
   * processed, and `ms/frame ÷ calls/frame` yields per-item cost.
   */
  recordElapsed(label: string, elapsedMs: number, count: number = 1): void {
    if (!this.enabled) return;
    const entryKey = this.getEntryKey(label);
    const entry = this.getOrCreate(entryKey);
    entry.frameCalls += count;
    entry.frameMs += elapsedMs;
    entry.maxMs = Math.max(entry.maxMs, elapsedMs);
  }

  /** Log a formatted report to console */
  report(): void {
    console.log("=== Profiler Report ===");
    const stats = this.getStats();
    for (const stat of stats) {
      const indent = "  ".repeat(stat.depth);
      const prefix = stat.depth > 0 ? "- " : "";
      const label = (indent + prefix + stat.shortLabel).padEnd(30);
      if (stat.msPerFrame > 0) {
        console.log(
          `${label} calls/frame: ${stat.callsPerFrame.toFixed(1).padStart(6)}  ` +
            `ms/frame: ${stat.msPerFrame.toFixed(2).padStart(7)}  ` +
            `max: ${stat.maxMs.toFixed(2).padStart(7)}ms`,
        );
      } else {
        console.log(
          `${label} calls/frame: ${stat.callsPerFrame.toFixed(1).padStart(6)}  (count only)`,
        );
      }
    }
    console.log("========================");
  }

  /**
   * Start accumulating exact totals. Unlike the smoothed per-frame numbers,
   * these are averages over the whole window, so they're the thing to use
   * for benchmarks. Also resets maxMs so that it covers just the capture.
   */
  startCapture(): void {
    this.capturing = true;
    this.captureFrames = 0;
    for (const entry of this.entries.values()) {
      entry.captureCalls = 0;
      entry.captureMs = 0;
      entry.maxMs = 0;
    }
  }

  /** Stop capturing and return the totals, in the same order as getStats(). */
  stopCapture(scope?: string): CaptureReport {
    this.capturing = false;
    const frames = Math.max(this.captureFrames, 1);
    const stats = this.getStats(undefined, scope).map((stat) => {
      const entry = this.entries.get(stat.label)!;
      return {
        label: stat.label,
        depth: stat.depth,
        totalMs: entry.captureMs,
        msPerFrame: entry.captureMs / frames,
        callsPerFrame: entry.captureCalls / frames,
        maxMs: entry.maxMs,
      };
    });
    return { frames: this.captureFrames, stats };
  }

  /** Clear all stats */
  reset(): void {
    this.entries.clear();
    this.pathCache.clear();
    this.stack = [];
  }

  /** Enable/disable profiling (disabled = no overhead) */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Check if profiling is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all stats sorted hierarchically.
   * Optimized to O(n log n) by building parent-child map in a single pass.
   * @param maxChildrenPerParent If specified, limits the number of children shown per parent
   * @param scope If specified, only return entries under this scope label
   */
  getStats(maxChildrenPerParent?: number, scope?: string): ProfileStats[] {
    // Build parent-child map in a single pass (O(n))
    const childrenMap = new Map<string, ProfileStats[]>();
    const msLookup = new Map<string, number>();

    // When scoped, only include entries that belong to the scope
    const scopePrefix = scope ? scope + this.separator : undefined;

    for (const [label, entry] of this.entries) {
      // Filter to scope if specified
      if (scope && label !== scope && !label.startsWith(scopePrefix!)) {
        continue;
      }

      const segments = label.split(this.separator);
      const stat: ProfileStats = {
        label,
        shortLabel: segments[segments.length - 1],
        depth: segments.length - 1,
        callsPerFrame: entry.smoothedCallsPerFrame,
        msPerFrame: entry.smoothedMsPerFrame,
        maxMs: entry.maxMs,
      };
      msLookup.set(label, entry.smoothedMsPerFrame);

      // Determine parent path and register this stat as a child
      const parentPath =
        segments.length > 1 ? segments.slice(0, -1).join(this.separator) : "";
      let children = childrenMap.get(parentPath);
      if (!children) {
        children = [];
        childrenMap.set(parentPath, children);
      }
      children.push(stat);
    }

    // Recursively build sorted list (O(n log n) total for sorting)
    const buildSortedList = (parentPath: string): ProfileStats[] => {
      const children = childrenMap.get(parentPath);
      if (!children || children.length === 0) return [];

      const parentMs = msLookup.get(parentPath) ?? 0;

      // Sort children by ms descending
      children.sort((a, b) => {
        if (parentMs > 0) {
          return b.msPerFrame / parentMs - a.msPerFrame / parentMs;
        }
        return b.msPerFrame - a.msPerFrame;
      });

      // Limit children if needed
      const limited =
        maxChildrenPerParent !== undefined
          ? children.slice(0, maxChildrenPerParent)
          : children;

      const result: ProfileStats[] = [];
      for (const child of limited) {
        result.push(child);
        result.push(...buildSortedList(child.label));
      }
      return result;
    };

    const children = buildSortedList(scope ?? "");

    // When scoped, prepend the scope's own entry as the root
    if (scope) {
      const scopeEntry = this.entries.get(scope);
      if (scopeEntry) {
        const segments = scope.split(this.separator);
        children.unshift({
          label: scope,
          shortLabel: segments[segments.length - 1],
          depth: segments.length - 1,
          callsPerFrame: scopeEntry.smoothedCallsPerFrame,
          msPerFrame: scopeEntry.smoothedMsPerFrame,
          maxMs: scopeEntry.maxMs,
        });
      }
    }

    return children;
  }

  /** Get top N stats by total time (cached within frame) */
  getTopStats(
    n: number,
    maxChildrenPerParent?: number,
    scope?: string,
  ): ProfileStats[] {
    // Check cache
    if (
      this.cachedStats &&
      this.cachedStatsParams?.maxChildren === maxChildrenPerParent &&
      this.cachedStatsParams?.scope === scope
    ) {
      return this.cachedStats.slice(0, n);
    }

    // Compute and cache
    const stats = this.getStats(maxChildrenPerParent, scope);
    this.cachedStats = stats;
    this.cachedStatsParams = { maxChildren: maxChildrenPerParent, scope };
    return stats.slice(0, n);
  }

  private getOrCreate(label: string): ProfileEntry {
    let entry = this.entries.get(label);
    if (!entry) {
      entry = {
        frameCalls: 0,
        frameMs: 0,
        captureCalls: 0,
        captureMs: 0,
        smoothedCallsPerFrame: 0,
        smoothedMsPerFrame: 0,
        maxMs: 0,
      };
      this.entries.set(label, entry);
    }
    return entry;
  }
}

export const profiler = new Profiler();

// Expose profiler globally for debugging
// Expose for poking at in the console (when there is one)
if (typeof window !== "undefined") {
  (window as any).profiler = profiler;
}

/**
 * Method decorator for easy profiling.
 *
 * Usage:
 *   class MyClass {
 *     @profile
 *     myMethod() { ... }
 *   }
 *
 * This will automatically profile as "MyClass.myMethod"
 */
export function profile(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const original = descriptor.value;
  descriptor.value = function (this: any, ...args: any[]) {
    const className = this.constructor.name;
    return profiler.measure(`${className}.${propertyKey}`, () => {
      return original.call(this, ...args);
    });
  };
}

/**
 * Method decorator for profiling async methods.
 *
 * Unlike @profile, this decorator records timing atomically after the
 * async operation completes, making it safe for parallel async operations
 * (e.g., multiple entities with async onTick running via Promise.all).
 *
 * Usage:
 *   class MyClass {
 *     @profileAsync
 *     async myAsyncMethod() { ... }
 *   }
 *
 * This will automatically profile as "MyClass.myAsyncMethod"
 */
export function profileAsync(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const original = descriptor.value;
  descriptor.value = async function (this: any, ...args: any[]) {
    const className = this.constructor.name;
    const label = `${className}.${propertyKey}`;
    const start = performance.now();
    try {
      return await original.call(this, ...args);
    } finally {
      profiler.recordElapsed(label, performance.now() - start);
    }
  };
}
