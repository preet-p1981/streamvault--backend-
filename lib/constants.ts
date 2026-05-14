/**
 * StreamVault — Shared constants
 */

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

export const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ko: 'Korean',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese',
}

export const CACHE_TTL = {
  TRENDING: 3600,
  NOWPLAYING: 86400,
  POPULAR: 43200,
  DETAILS: 86400,
  SEASON: 86400,
  SEARCH: 300,
  PLAYER: 3600,
  NEXT_EPISODE: 86400,
  DISCOVER: 43200,
} as const

export const DEFAULT_MIN_VOTES = '50'
