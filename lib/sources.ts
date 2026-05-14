/**
 * StreamVault — Player Source Definitions
 *
 * All embed sources used by the player are declared here.
 * Each source has:
 *   - name:     display name (shown in player UI)
 *   - priority: ascending order, 1 = best
 *   - quality:  'HD' | 'SD' | 'unknown'
 *   - buildUrl: pure function that builds the final iframe src URL
 *
 * IMPORTANT:
 *   We DO NOT make outbound requests to probe sources from the server.
 *   The frontend uses an iframe-load timeout to detect failure and
 *   automatically falls back to the next source in priority order.
 */

export type SourceQuality = 'HD' | 'SD' | 'unknown'

export interface MovieSourceDef {
  name: string
  priority: number
  quality: SourceQuality
  buildUrl: (id: number) => string
}

export interface TvSourceDef {
  name: string
  priority: number
  quality: SourceQuality
  buildUrl: (id: number, season: number, episode: number) => string
}

export const MOVIE_SOURCES: MovieSourceDef[] = [
  {
    name: 'VidLink',
    priority: 1,
    quality: 'HD',
    buildUrl: (id: number) => `https://vidlink.pro/movie/${id}`,
  },
  {
    name: '2Embed',
    priority: 2,
    quality: 'HD',
    buildUrl: (id: number) => `https://www.2embed.stream/embed/movie/${id}`,
  },
  {
    name: 'AutoEmbed',
    priority: 3,
    quality: 'HD',
    buildUrl: (id: number) => `https://autoembed.co/movie/tmdb/${id}`,
  },
  {
    name: 'VidSrc',
    priority: 4,
    quality: 'HD',
    buildUrl: (id: number) => `https://vidsrc.icu/embed/movie/${id}`,
  },
  {
    name: 'SuperEmbed',
    priority: 5,
    quality: 'HD',
    buildUrl: (id: number) => `https://multiembed.mov/direct?id=${id}&type=movie`,
  },
]

export const TV_SOURCES: TvSourceDef[] = [
  {
    name: 'VidLink',
    priority: 1,
    quality: 'HD',
    buildUrl: (id: number, s: number, e: number) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: '2Embed',
    priority: 2,
    quality: 'HD',
    buildUrl: (id: number, s: number, e: number) =>
      `https://www.2embed.stream/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'AutoEmbed',
    priority: 3,
    quality: 'HD',
    buildUrl: (id: number, s: number, e: number) =>
      `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    name: 'VidSrc',
    priority: 4,
    quality: 'HD',
    buildUrl: (id: number, s: number, e: number) =>
      `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'SuperEmbed',
    priority: 5,
    quality: 'HD',
    buildUrl: (id: number, s: number, e: number) =>
      `https://multiembed.mov/direct?id=${id}&s=${s}&e=${e}&type=tv`,
  },
]
