/**
 * GET /api/movie/[id]
 * Full TMDB movie object with appended credits, similar, recommendations, videos.
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const revalidate = 86400

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNum = Number(params.id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid movie id', status: 400 }, { status: 400 })
    }

    const data = await fetchTMDB<any>(`/movie/${idNum}`, {
      revalidate: CACHE_TTL.DETAILS,
      params: { append_to_response: 'credits,similar,recommendations,videos' },
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL.DETAILS}, stale-while-revalidate=86400`,
      },
    })
  } catch (error) {
    if (error instanceof TMDBError) {
      if (error.status === 404) {
        return NextResponse.json({ error: 'Movie not found', status: 404 }, { status: 404 })
      }
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[movie/[id]]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
