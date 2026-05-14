/**
 * GET /api/health
 * Simple liveness probe — useful for Vercel / Docker health checks.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'streamvault-backend',
    tmdb: Boolean(process.env.TMDB_API_KEY) ? 'configured' : 'missing',
    redis: process.env.UPSTASH_REDIS_URL ? 'configured' : 'disabled',
    timestamp: new Date().toISOString(),
  })
}
