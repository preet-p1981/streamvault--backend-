/**
 * GET /api/trending
 * TMDB: /trending/all/day
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, normalizeList, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const revalidate = 3600

export async function GET() {
  try {
    const raw = await fetchTMDB<{ results: any[] }>('/trending/all/day', {
      revalidate: CACHE_TTL.TRENDING,
    })
    return NextResponse.json(
      { results: normalizeList(raw) },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL.TRENDING}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (error) {
    if (error instanceof TMDBError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[trending]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
