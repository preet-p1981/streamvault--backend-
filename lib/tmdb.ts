/**
 * StreamVault — TMDB Client
 *
 * Centralized TMDB fetching with:
 *   - Typed errors (TMDBError)
 *   - Built-in Next.js fetch cache (revalidate)
 *   - Helpers to normalize movie/tv shape into MediaItem
 */

import type { MediaItem, TMDBMovieRaw } from '@/types'

export class TMDBError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TMDBError'
    this.status = status
  }
}

const DEFAULT_REVALIDATE = 43200 // 12h

interface FetchTMDBOptions {
  /** Next.js ISR revalidate window in seconds. Default 12h. */
  revalidate?: number
  /** Extra query string params to append (api_key auto-added). */
  params?: Record<string, string | number | undefined>
}

/**
 * Fetch a TMDB endpoint. Throws TMDBError on non-2xx.
 */
export async function fetchTMDB<T = any>(
  path: string,
  options: FetchTMDBOptions = {}
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY
  const baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3'

  if (!apiKey) {
    throw new TMDBError(500, 'TMDB_API_KEY is not configured on the server.')
  }

  const url = new URL(`${baseUrl}${path}`)
  url.searchParams.set('api_key', apiKey)

  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (v === undefined || v === null || v === '') continue
      url.searchParams.set(k, String(v))
    }
  }

  const revalidate =
    typeof options.revalidate === 'number' ? options.revalidate : DEFAULT_REVALIDATE

  let res: Response
  try {
    res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    })
  } catch (err: any) {
    throw new TMDBError(502, `TMDB network error: ${err?.message ?? 'unknown'}`)
  }

  if (!res.ok) {
    throw new TMDBError(res.status, `TMDB ${res.status}: ${path}`)
  }

  return (await res.json()) as T
}

/**
 * Normalize a raw TMDB movie/tv list entry into the unified MediaItem shape.
 * Forces a media_type if not present on the raw payload (used by /discover).
 */
export function normalizeMedia(
  raw: TMDBMovieRaw,
  forcedType?: 'movie' | 'tv'
): MediaItem {
  const media_type: 'movie' | 'tv' =
    (raw.media_type as 'movie' | 'tv') ||
    forcedType ||
    (raw.title ? 'movie' : 'tv')

  const title = raw.title ?? raw.name ?? ''
  const release_date = raw.release_date ?? raw.first_air_date ?? ''

  return {
    id: raw.id,
    title,
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    overview: raw.overview ?? '',
    vote_average: raw.vote_average ?? 0,
    release_date,
    media_type,
    genre_ids: raw.genre_ids ?? [],
  }
}

/**
 * Normalize an entire TMDB list response. Skips `person` type entries.
 */
export function normalizeList(
  raw: { results: TMDBMovieRaw[] },
  forcedType?: 'movie' | 'tv'
): MediaItem[] {
  if (!raw?.results) return []
  return raw.results
    .filter((r) => r.media_type !== 'person')
    .map((r) => normalizeMedia(r, forcedType))
}
