/**
 * GET /api/player/next-episode
 *
 * Given the current TV episode, return the next playable one
 * (next episode in the same season, or S+1 E1 if that season is exhausted).
 *
 * Query params:
 *   tmdb_id  (required)
 *   season   (required)
 *   episode  (required)
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, TMDBError } from '@/lib/tmdb'
import { withCache } from '@/lib/cache'
import { CACHE_TTL } from '@/lib/constants'
import type { NextEpisodeResponse } from '@/types'

export const dynamic = 'force-dynamic'

interface TmdbSeasonSummary {
  season_number: number
  episode_count: number
}

interface TmdbSeriesDetail {
  id: number
  seasons: TmdbSeasonSummary[]
}

interface TmdbEpisode {
  episode_number: number
  season_number: number
  name: string
  overview: string
  still_path: string | null
  runtime: number | null
}

interface TmdbSeasonDetail {
  episodes: TmdbEpisode[]
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message, status }, { status })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tmdbIdRaw = searchParams.get('tmdb_id')
    const seasonRaw = searchParams.get('season')
    const episodeRaw = searchParams.get('episode')

    if (!tmdbIdRaw) return bad('tmdb_id is required')
    if (!seasonRaw) return bad('season is required')
    if (!episodeRaw) return bad('episode is required')

    const tmdb_id = Number(tmdbIdRaw)
    const season = Number(seasonRaw)
    const episode = Number(episodeRaw)

    if (!Number.isFinite(tmdb_id) || tmdb_id <= 0) return bad('tmdb_id must be positive')
    if (!Number.isFinite(season) || season < 0) return bad('season must be non-negative')
    if (!Number.isFinite(episode) || episode < 1) return bad('episode must be positive')

    const cacheKey = `next-episode:${tmdb_id}:${season}:${episode}`

    const payload = await withCache<NextEpisodeResponse>(
      cacheKey,
      CACHE_TTL.NEXT_EPISODE,
      async () => {
        // Try same-season +1 first
        const seasonDetail = await fetchTMDB<TmdbSeasonDetail>(
          `/tv/${tmdb_id}/season/${season}`,
          { revalidate: CACHE_TTL.SEASON }
        )

        const nextInSeason = seasonDetail.episodes?.find(
          (e) => e.episode_number === episode + 1
        )

        if (nextInSeason) {
          return {
            hasNext: true,
            next: {
              season,
              episode: nextInSeason.episode_number,
              name: nextInSeason.name ?? '',
              overview: nextInSeason.overview ?? '',
              still_path: nextInSeason.still_path ?? null,
              runtime: nextInSeason.runtime ?? null,
              url: `/watch/series/${tmdb_id}/${season}/${nextInSeason.episode_number}`,
            },
          }
        }

        // Otherwise look at season+1
        const seriesDetail = await fetchTMDB<TmdbSeriesDetail>(
          `/tv/${tmdb_id}`,
          { revalidate: CACHE_TTL.DETAILS }
        )

        const nextSeasonMeta = seriesDetail.seasons?.find(
          (s) => s.season_number === season + 1
        )

        if (nextSeasonMeta && nextSeasonMeta.episode_count > 0) {
          const nextSeasonDetail = await fetchTMDB<TmdbSeasonDetail>(
            `/tv/${tmdb_id}/season/${season + 1}`,
            { revalidate: CACHE_TTL.SEASON }
          )
          const firstEp = nextSeasonDetail.episodes?.[0]
          if (firstEp) {
            return {
              hasNext: true,
              next: {
                season: season + 1,
                episode: firstEp.episode_number,
                name: firstEp.name ?? '',
                overview: firstEp.overview ?? '',
                still_path: firstEp.still_path ?? null,
                runtime: firstEp.runtime ?? null,
                url: `/watch/series/${tmdb_id}/${season + 1}/${firstEp.episode_number}`,
              },
            }
          }
        }

        return {
          hasNext: false,
          next: null,
          message: "You've reached the finale!",
        }
      }
    )

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL.NEXT_EPISODE}, stale-while-revalidate=86400`,
      },
    })
  } catch (error) {
    if (error instanceof TMDBError && error.status === 404) {
      return NextResponse.json({ error: 'Series or season not found', status: 404 }, { status: 404 })
    }
    console.error('[player/next-episode]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
