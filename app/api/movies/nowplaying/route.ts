import { NextResponse } from 'next/server'
import { fetchTMDB, normalizeList, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const revalidate = 86400

export async function GET() {
  try {
    const raw = await fetchTMDB<{ results: any[] }>('/movie/now_playing', {
      revalidate: CACHE_TTL.NOWPLAYING,
    })
    return NextResponse.json(
      { results: normalizeList(raw, 'movie') },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL.NOWPLAYING}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (error) {
    if (error instanceof TMDBError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[movies/nowplaying]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
