import "server-only";
import { headers } from "next/headers";

/**
 * Tiny in-memory sliding-window rate limiter (per serverless instance).
 * Good enough for a small store; swap for Upstash Redis for multi-instance accuracy.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return { ok: false, remaining: 0 };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    // opportunistic cleanup
    for (const [k, v] of buckets) if (v.every((t) => now - t > windowMs)) buckets.delete(k);
  }
  return { ok: true, remaining: limit - arr.length };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function assertRateLimit(scope: string, limit: number, windowMs: number) {
  const ip = await clientIp();
  const res = rateLimit(`${scope}:${ip}`, limit, windowMs);
  if (!res.ok) throw new Error("Too many requests. Please try again in a few minutes.");
}
