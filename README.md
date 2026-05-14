# 🎬 StreamVault — Backend API

A Netflix-clone streaming backend built with **Next.js 14 App Router** + **TypeScript**.
This codebase contains ONLY the `/app/api/` routes and `lib/` utilities — the frontend
is a separate codebase that consumes these routes.

> 🥇 **#1 Priority:** The Player Source System (`/api/player/sources`).
> It is the reason the site exists. It is built to be robust, fast, and cache-friendly.

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# then edit .env and add your TMDB_API_KEY (https://www.themoviedb.org/settings/api)

# 3. Run dev server
npm run dev
# → http://localhost:3000

# 4. Test the player source endpoint (the most important one)
curl "http://localhost:3000/api/player/sources?tmdb_id=550&type=movie"
```

You should see 7 sources for Fight Club (TMDB id 550), sorted by priority.

---

## 🔑 Environment Variables

| Variable              | Required | Purpose                                                       |
| --------------------- | -------- | ------------------------------------------------------------- |
| `TMDB_API_KEY`        | ✅       | TMDB v3 API key. Server-side only — never exposed to client. |
| `TMDB_BASE_URL`       | ✅       | `https://api.themoviedb.org/3`                                |
| `TMDB_IMAGE_BASE`     | ✅       | `https://image.tmdb.org/t/p`                                  |
| `UPSTASH_REDIS_URL`   | ⚪️      | Optional. Adds Redis cache layer.                             |
| `UPSTASH_REDIS_TOKEN` | ⚪️      | Optional. Pairs with `UPSTASH_REDIS_URL`.                     |
| `CORS_ORIGIN`         | ⚪️      | Defaults to `*`. Set to your frontend origin in prod.         |

> Variables are intentionally **not** prefixed with `NEXT_PUBLIC_`. The TMDB API key never reaches the browser.

---

## 📡 API Routes

| Method | Path                                  | Purpose                                            |
| ------ | ------------------------------------- | -------------------------------------------------- |
| GET    | `/api/player/sources`                 | ⭐ Build all embed source URLs for a movie/episode |
| GET    | `/api/player/next-episode`            | Find the next playable TV episode                  |
| GET    | `/api/trending`                       | TMDB trending (movies + tv)                        |
| GET    | `/api/movies/popular`                 | Popular movies                                     |
| GET    | `/api/movies/nowplaying`              | Now-playing movies                                 |
| GET    | `/api/series/popular`                 | Popular TV series                                  |
| GET    | `/api/movie/[id]`                     | Full movie detail (+credits/similar/videos)        |
| GET    | `/api/series/[id]`                    | Full series detail (+credits/similar/videos)       |
| GET    | `/api/series/[id]/season/[s]`         | Season detail (with episodes)                      |
| GET    | `/api/search?q=...&page=1`            | Multi-search across movies + tv                    |
| GET    | `/api/discover?type=...&genre=...`    | Filterable discover (genre, year, lang, country)   |

### 📤 Response Contract

All list routes:
```ts
{ results: MediaItem[], total_pages?: number, page?: number, total?: number }
```

`MediaItem`:
```ts
{
  id: number
  title: string                // unified — movie.title OR tv.name
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date: string         // unified — release_date OR first_air_date
  media_type: 'movie' | 'tv'
  genre_ids: number[]
}
```

Player sources:
```ts
{
  sources: PlayerSource[],
  tmdb_id: number,
  type: 'movie' | 'tv',
  total: number
}
```

Errors:
```ts
{ error: string, status: 4xx | 5xx }
```

---

## 🎯 Player Source System (deep dive)

Defined in `lib/sources.ts`. Seven embed providers, ordered by `priority` (1 = best):

| # | Provider     | Quality |
|---|--------------|---------|
| 1 | VidSrc       | HD      |
| 2 | VidLink      | HD      |
| 3 | 2Embed       | HD      |
| 4 | SuperEmbed   | HD      |
| 5 | Embed.su     | SD      |
| 6 | AutoEmbed    | HD      |
| 7 | VidSrc.me    | HD      |

### Why we don't probe sources server-side

A health check via `fetch` would:
- Add 500–3000ms to every player load
- Often false-negative (CORS, anti-bot, geo-block at server edge)
- Often false-positive (200 OK with a broken player UI inside the iframe)

Instead, the **frontend** wraps the `<iframe>` with a `load` timeout. If the iframe
doesn't emit `load` within ~5s, it switches to the next source. This is fast, accurate,
and gives users a working "try another source" button for free.

### Example call

```bash
# Movie
curl "http://localhost:3000/api/player/sources?tmdb_id=550&type=movie"

# TV episode
curl "http://localhost:3000/api/player/sources?tmdb_id=1396&type=tv&season=1&episode=1"
```

---

## 🗄️ Caching Strategy

**Two layers** (both optional, both compose cleanly):

1. **Next.js fetch cache (always on)** — every TMDB call uses
   `fetch(url, { next: { revalidate: SECONDS } })`. This works on Vercel and any
   Node server with persistent disk.
2. **Upstash Redis (opt-in)** — if `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` are
   set, `withCache()` (in `lib/cache.ts`) layers Redis on top. Read-through,
   fire-and-forget writes, no SDK required (uses the REST API).

| Resource       | TTL     |
| -------------- | ------- |
| Trending       | 1 hour  |
| Now playing    | 24 hours|
| Popular        | 12 hours|
| Search         | 5 min   |
| Movie/Series   | 24 hours|
| Season/Episode | 24 hours|
| Player sources | 1 hour  |
| Next episode   | 24 hours|

---

## 🛡️ Error Handling

Every route uses the same try/catch shape and emits the standard `ApiError`:

```ts
{ error: "Movie not found", status: 404 }
```

`TMDBError` (in `lib/tmdb.ts`) carries the HTTP status from TMDB so 404s from
upstream surface as 404s to the frontend.

---

## 📁 File Structure

```
streamvault-backend/
├── app/
│   └── api/
│       ├── trending/route.ts
│       ├── movies/
│       │   ├── popular/route.ts
│       │   └── nowplaying/route.ts
│       ├── series/
│       │   ├── popular/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── season/[s]/route.ts
│       ├── movie/[id]/route.ts
│       ├── search/route.ts
│       ├── discover/route.ts
│       └── player/
│           ├── sources/route.ts        ← ⭐ MOST IMPORTANT
│           └── next-episode/route.ts
├── lib/
│   ├── tmdb.ts          — fetchTMDB, TMDBError, normalizeMedia
│   ├── sources.ts       — MOVIE_SOURCES, TV_SOURCES
│   ├── cache.ts         — Optional Redis wrapper
│   └── constants.ts     — GENRE_MAP, LANGUAGE_MAP, CACHE_TTL
├── types/
│   └── index.ts         — MediaItem, PlayerSource, ApiError, …
├── .env.example
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 🧪 Smoke Test Checklist

```bash
# Player sources — movie
curl -s "http://localhost:3000/api/player/sources?tmdb_id=550&type=movie" | jq

# Player sources — TV episode (Breaking Bad S1E1)
curl -s "http://localhost:3000/api/player/sources?tmdb_id=1396&type=tv&season=1&episode=1" | jq

# Next episode
curl -s "http://localhost:3000/api/player/next-episode?tmdb_id=1396&season=1&episode=1" | jq

# Trending
curl -s "http://localhost:3000/api/trending" | jq '.results | length'

# Movie detail
curl -s "http://localhost:3000/api/movie/550" | jq '.title'

# Discover Korean shows
curl -s "http://localhost:3000/api/discover?type=tv&lang=ko&sort=popularity.desc" | jq '.results | length'
```

---

## 🚫 Out of Scope

This package intentionally does **not** include:
- React components or pages
- Authentication / user accounts
- Admin / CMS
- Server-side iframe probing (frontend handles failover)

Build the UI separately and point it at this API.

---

## 📜 License

MIT — do whatever you want, just don't blame me when an embed provider goes down.
