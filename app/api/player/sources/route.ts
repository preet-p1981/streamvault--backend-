/**
 * GET /api/player/sources
 *
 * Returns embed source URLs for movies/TV episodes.
 * This endpoint does NOT call external APIs - it just builds embed URLs.
 */

import { NextResponse } from 'next/server'
import { MOVIE_SOURCES, TV_SOURCES } from '@/lib/sources'
import type { PlayerSource } from '@/types'

export const dynamic = 'force-dynamic'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message, status }, { status })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const tmdbIdRaw = searchParams.get('tmdb_id')
    const typeRaw = searchParams.get('type')
    const seasonRaw = searchParams.get('season')
    const episodeRaw = searchParams.get('episode')

    if (!tmdbIdRaw) return bad('tmdb_id is required')
    if (!typeRaw) return bad('type is required')
    if (typeRaw !== 'movie' && typeRaw !== 'tv') {
      return bad('type must be movie or tv')
    }

    const tmdb_id = Number(tmdbIdRaw)
    if (!Number.isFinite(tmdb_id) || tmdb_id <= 0) {
      return bad('tmdb_id must be a positive integer')
    }

    let sources: PlayerSource[]

    if (typeRaw === 'movie') {
      sources = MOVIE_SOURCES.map((s) => ({
        name: s.name,
        url: s.buildUrl(tmdb_id),
        priority: s.priority,
        isWorking: true,
        quality: s.quality,
      }))
    } else {
      const season = seasonRaw ? Number(seasonRaw) : 1
      const episode = episodeRaw ? Number(episodeRaw) : 1
      sources = TV_SOURCES.map((s) => ({
        name: s.name,
        url: s.buildUrl(tmdb_id, season, episode),
        priority: s.priority,
        isWorking: true,
        quality: s.quality,
      }))
    }

    sources.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({
      sources,
      tmdb_id,
      type: typeRaw,
      total: sources.length,
    })
  } catch (error) {
    console.error('[player/sources]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}