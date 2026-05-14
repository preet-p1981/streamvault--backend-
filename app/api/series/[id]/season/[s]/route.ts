/**
 * GET /api/series/[id]/season/[s]
 * Returns the season object (including episodes[]) from TMDB.
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const revalidate = 86400

export async function GET(
  _request: Request,
  { params }: { params: { id: string; s: string } }
) {
  try {
    const idNum = Number(params.id)
    const seasonNum = Number(params.s)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid series id', status: 400 }, { status: 400 })
    }
    if (!Number.isFinite(seasonNum) || seasonNum < 0) {
      return NextResponse.json({ error: 'Invalid season number', status: 400 }, { status: 400 })
    }

    const data = await fetchTMDB<any>(`/tv/${idNum}/season/${seasonNum}`, {
      revalidate: CACHE_TTL.SEASON,
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL.SEASON}, stale-while-revalidate=86400`,
      },
    })
  } catch (error) {
    if (error instanceof TMDBError) {
      if (error.status === 404) {
        return NextResponse.json({ error: 'Season not found', status: 404 }, { status: 404 })
      }
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[series/[id]/season/[s]]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
