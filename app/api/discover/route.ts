/**
 * GET /api/discover
 * TMDB: /discover/movie or /discover/tv
 *
 * Query params (all optional):
 *   type      'movie' | 'tv'                 default: 'movie'
 *   genre     string (TMDB genre id)
 *   year      string (release year)
 *   lang      ISO 639-1 (hi, ta, te, ko, ja, en, es, ...)
 *   country   ISO 3166-1 (KR, JP, IN, US, ...)
 *   sort      popularity.desc | vote_average.desc | release_date.desc | release_date.asc
 *   page      default '1'
 *   minVotes  default '50'
 */

import { NextResponse } from 'next/server'
import { fetchTMDB, normalizeList, TMDBError } from '@/lib/tmdb'
import { CACHE_TTL, DEFAULT_MIN_VOTES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const ALLOWED_SORTS = new Set([
  'popularity.desc',
  'popularity.asc',
  'vote_average.desc',
  'vote_average.asc',
  'release_date.desc',
  'release_date.asc',
  'first_air_date.desc',
  'first_air_date.asc',
])

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const type = (searchParams.get('type') as 'movie' | 'tv' | null) ?? 'movie'
    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json({ error: 'type must be movie or tv', status: 400 }, { status: 400 })
    }

    const genre = searchParams.get('genre') ?? undefined
    const year = searchParams.get('year') ?? undefined
    const lang = searchParams.get('lang') ?? undefined
    const country = searchParams.get('country') ?? undefined
    const sort = searchParams.get('sort') ?? undefined
    const page = searchParams.get('page') ?? '1'
    const minVotes = searchParams.get('minVotes') ?? DEFAULT_MIN_VOTES

    if (sort && !ALLOWED_SORTS.has(sort)) {
      return NextResponse.json({ error: 'invalid sort value', status: 400 }, { status: 400 })
    }

    const params: Record<string, string | number | undefined> = {
      page,
      'vote_count.gte': minVotes,
      include_adult: 'false',
    }

    if (genre) params.with_genres = genre
    if (lang) params.with_original_language = lang
    if (country) params.with_origin_country = country
    if (sort) params.sort_by = sort

    if (year) {
      if (type === 'movie') params.primary_release_year = year
      else params.first_air_date_year = year
    }

    const raw = await fetchTMDB<{
      results: any[]
      page: number
      total_pages: number
      total_results: number
    }>(`/discover/${type}`, {
      revalidate: CACHE_TTL.DISCOVER,
      params,
    })

    return NextResponse.json(
      {
        results: normalizeList(raw, type),
        page: raw.page,
        total_pages: raw.total_pages,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL.DISCOVER}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (error) {
    if (error instanceof TMDBError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status })
    }
    console.error('[discover]', error)
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
