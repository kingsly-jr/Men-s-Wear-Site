import { RateLimitError } from "@/lib/constants/errors";

interface RateBucket {
  timestamps: number[];
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateBucket>;
};

const store =
  globalForRateLimit.rateLimitStore ?? new Map<string, RateBucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitStore = store;
}

/**
 * Sliding-window rate limiter keyed by scope + identifier (e.g. IP or email).
 */
export function enforceRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): void {
  const now = Date.now();
  const windowStart = now - params.windowMs;
  const bucket = store.get(params.key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= params.limit) {
    store.set(params.key, bucket);
    throw new RateLimitError();
  }

  bucket.timestamps.push(now);
  store.set(params.key, bucket);
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "127.0.0.1";
}
