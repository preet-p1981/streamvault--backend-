import { NextResponse } from 'next/server'
import { fetchTMDB, normalizeList, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const revalidate = 43200

export async function GET() {
  try {
    const raw = await fetchTMDB<{ results: any[] }>('/tv/popular', {
      revalidate: CACHE_TTL.POPULAR,
    })
    return NextResponse.json(
      { results: normalizeList(raw, 'tv') },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL.POPULAR}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (error) {
    if (error instanceof TMDBError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[series/popular]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
