/**
 * StreamVault — Shared TypeScript Types
 *
 * The frontend depends on the EXACT shape of these interfaces.
 * Do not break the contract. Add new fields as optional only.
 */

export interface MediaItem {
  id: number
  title: string // unified: movie.title OR tv.name
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date: string // unified: movie.release_date OR tv.first_air_date
  media_type: 'movie' | 'tv'
  genre_ids: number[]
}

export interface PlayerSource {
  name: string
  url: string
  priority: number
  isWorking: boolean
  quality: 'HD' | 'SD' | 'unknown'
}

export interface ApiError {
  error: string
  status: number
}

/** Standard list-route response */
export interface ListResponse<T = MediaItem> {
  results: T[]
  page?: number
  total?: number
  total_pages?: number
}

/** Player /api/player/sources response */
export interface PlayerSourcesResponse {
  sources: PlayerSource[]
  tmdb_id: number
  type: 'movie' | 'tv'
  total: number
  season?: number
  episode?: number
}

/** Player /api/player/next-episode response */
export interface NextEpisodePayload {
  season: number
  episode: number
  name: string
  overview: string
  still_path: string | null
  runtime: number | null
  url: string
}

export interface NextEpisodeResponse {
  hasNext: boolean
  next: NextEpisodePayload | null
  message?: string
}

/** Raw TMDB movie list entry (subset we rely on) */
export interface TMDBMovieRaw {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  media_type?: 'movie' | 'tv' | 'person'
  genre_ids?: number[]
}

/** Detail responses are passed through TMDB shape — keep as any */
export type MovieDetail = any
export type SeriesDetail = any
export type SeasonDetail = any
