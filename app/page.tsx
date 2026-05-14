/**
 * StreamVault is a backend-only Next.js app.
 *
 * The frontend is a separate codebase — this index page exists only so
 * visitors to the root URL get a friendly "you're at the API, not the UI" hint
 * instead of a 404. All actual functionality lives under /api/*.
 */

export default function ApiIndex() {
  return (
    <main
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        padding: '2rem',
        lineHeight: 1.6,
        maxWidth: 720,
        margin: '0 auto',
        color: '#e5e7eb',
        background: '#0a0a0a',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎬 StreamVault API</h1>
      <p style={{ color: '#a3a3a3' }}>
        Backend-only Next.js service. All endpoints live under{' '}
        <code style={{ background: '#1f1f1f', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
          /api/*
        </code>
        .
      </p>

      <h2 style={{ fontSize: '1.05rem', marginTop: '2rem' }}>Quick test</h2>
      <pre
        style={{
          background: '#171717',
          padding: '1rem',
          borderRadius: 8,
          overflowX: 'auto',
          fontSize: '0.85rem',
        }}
      >
{`curl /api/health
curl "/api/player/sources?tmdb_id=550&type=movie"
curl "/api/trending"`}
      </pre>

      <h2 style={{ fontSize: '1.05rem', marginTop: '2rem' }}>Routes</h2>
      <ul style={{ paddingLeft: '1.25rem' }}>
        <li>GET /api/health</li>
        <li>GET /api/player/sources</li>
        <li>GET /api/player/next-episode</li>
        <li>GET /api/trending</li>
        <li>GET /api/movies/popular</li>
        <li>GET /api/movies/nowplaying</li>
        <li>GET /api/series/popular</li>
        <li>GET /api/movie/[id]</li>
        <li>GET /api/series/[id]</li>
        <li>GET /api/series/[id]/season/[s]</li>
        <li>GET /api/search?q=…</li>
        <li>GET /api/discover?type=…</li>
      </ul>

      <p style={{ color: '#737373', marginTop: '2rem', fontSize: '0.85rem' }}>
        See <code>README.md</code> for full docs.
      </p>
    </main>
  )
}
