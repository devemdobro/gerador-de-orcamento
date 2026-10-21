import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Orçamentos', robots: { index: false, follow: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main>{children}</main>
      </body>
    </html>
  )
}
