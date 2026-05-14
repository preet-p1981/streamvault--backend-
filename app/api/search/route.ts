/**
 * GET /api/search?q=...&page=1
 * TMDB: /search/multi
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, normalizeList, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const page = searchParams.get('page') ?? '1'

    if (!q) {
      return NextResponse.json({ error: 'q is required', status: 400 }, { status: 400 })
    }

    const pageNum = Number(page)
    if (!Number.isFinite(pageNum) || pageNum < 1) {
      return NextResponse.json({ error: 'page must be a positive integer', status: 400 }, { status: 400 })
    }

    const raw = await fetchTMDB<{
      results: any[]
      total_results: number
      total_pages: number
      page: number
    }>('/search/multi', {
      revalidate: CACHE_TTL.SEARCH,
      params: { query: q, page },
    })

    const results = normalizeList(raw)

    return NextResponse.json(
      {
        results,
        page: raw.page,
        total: raw.total_results,
        total_pages: raw.total_pages,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL.SEARCH}, stale-while-revalidate=600`,
        },
      }
    )
  } catch (error) {
    if (error instanceof TMDBError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[search]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
