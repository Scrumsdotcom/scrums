/**
 * Resource limits. Every input the checker reads is untrusted, so every
 * phase runs under an explicit bound. Exceeding a bound is reported as a
 * diagnostic (code LIM or RES), never as a crash or a hang.
 */
export interface Limits {
  /** Maximum size of a whole stream or manifest, in UTF-8 bytes. */
  maxInputBytes: number;
  /** Maximum number of frames in one stream. */
  maxFrames: number;
  /** Maximum size of one frame (one line), in UTF-8 bytes. */
  maxFrameBytes: number;
  /** Maximum nesting depth of parentheses in one term. */
  maxDepth: number;
  /** Maximum number of atoms and lists in one frame. */
  maxNodes: number;
  /** Maximum number of decimal digits in one numeric literal. */
  maxLiteralDigits: number;
  /** Maximum bit length of any integer produced during evaluation. */
  maxIntBits: number;
  /** Maximum number of evaluation steps for one check or evaluation. */
  maxSteps: number;
  /** Maximum budget accepted by a `get` frame. */
  maxGetBudget: number;
  /** Maximum number of constants plus context entries in a manifest. */
  maxManifestEntries: number;
}

export const DEFAULT_LIMITS: Readonly<Limits> = Object.freeze({
  maxInputBytes: 1 << 20,
  maxFrames: 10_000,
  maxFrameBytes: 64 << 10,
  maxDepth: 128,
  maxNodes: 20_000,
  maxLiteralDigits: 512,
  maxIntBits: 8192,
  maxSteps: 1_000_000,
  maxGetBudget: 1 << 20,
  maxManifestEntries: 4096,
});

export function resolveLimits(partial?: Partial<Limits>): Limits {
  const out: Limits = { ...DEFAULT_LIMITS };
  if (partial) {
    for (const key of Object.keys(DEFAULT_LIMITS) as (keyof Limits)[]) {
      const v = partial[key];
      if (v === undefined) continue;
      if (!Number.isSafeInteger(v) || v <= 0) {
        throw new RangeError(`limit ${key} must be a positive safe integer`);
      }
      // A caller may tighten a limit, never loosen it past the default.
      out[key] = Math.min(v, DEFAULT_LIMITS[key]);
    }
  }
  return out;
}

/** Thrown when an evaluation or check runs out of a bounded resource. */
export class ResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceError";
  }
}

/** A step counter shared by evaluation and conversion in one check. */
export class Fuel {
  private left: number;
  constructor(readonly limits: Limits) {
    this.left = limits.maxSteps;
  }
  tick(): void {
    if (--this.left < 0) {
      throw new ResourceError(`evaluation exceeded ${this.limits.maxSteps} steps`);
    }
  }
  checkInt(v: bigint): bigint {
    const bits = (v < 0n ? -v : v).toString(2).length;
    if (bits > this.limits.maxIntBits) {
      throw new ResourceError(`integer exceeds ${this.limits.maxIntBits} bits`);
    }
    return v;
  }
}
