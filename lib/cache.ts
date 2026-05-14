/**
 * StreamVault — Optional Redis cache wrapper (Upstash)
 *
 * The whole backend works fine WITHOUT Redis — Next.js fetch caching is
 * the primary layer. This file is opt-in: if UPSTASH_REDIS_URL and
 * UPSTASH_REDIS_TOKEN are set in env, we layer Redis on top.
 *
 * We use the Upstash REST API directly (no SDK dependency) so the project
 * stays light. If you want the SDK, run:
 *   npm install @upstash/redis
 * and the SDK will be auto-detected.
 */

type AnyJson = any

const REDIS_URL = process.env.UPSTASH_REDIS_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN

const REDIS_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN)

function buildKey(key: string): string {
  return key.startsWith('streamvault:') ? key : `streamvault:${key}`
}

/**
 * Low-level GET via Upstash REST.
 * Returns the parsed JSON value, or null if missing / on error.
 */
async function redisGet<T = AnyJson>(key: string): Promise<T | null> {
  if (!REDIS_ENABLED) return null
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(buildKey(key))}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { result: string | null }
    if (!body || body.result == null) return null
    try {
      return JSON.parse(body.result) as T
    } catch {
      return body.result as unknown as T
    }
  } catch {
    return null
  }
}

/**
 * Low-level SET with TTL via Upstash REST.
 * Silently no-ops on error — cache must never break the request.
 */
async function redisSetex(key: string, ttlSeconds: number, value: AnyJson): Promise<void> {
  if (!REDIS_ENABLED) return
  try {
    const serialized = encodeURIComponent(JSON.stringify(value))
    const url = `${REDIS_URL}/setex/${encodeURIComponent(buildKey(key))}/${ttlSeconds}/${serialized}`
    await fetch(url, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    })
  } catch {
    /* swallow */
  }
}

/**
 * High-level helper: read-through cache.
 * Falls back to the fetcher if Redis is unavailable or missing.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!REDIS_ENABLED) return fetcher()

  const cached = await redisGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  // Fire and forget — don't block the response on the write
  redisSetex(key, ttlSeconds, fresh).catch(() => {})
  return fresh
}

export const cache = {
  enabled: REDIS_ENABLED,
  get: redisGet,
  setex: redisSetex,
  withCache,
}
