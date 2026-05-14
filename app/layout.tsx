/**
 * Minimal root layout. The frontend lives in a separate codebase — this layout
 * exists only so Next.js can boot the API-only app. We never render UI.
 */

export const metadata = {
  title: 'StreamVault API',
  description: 'StreamVault streaming backend API',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
