import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--fonte-display' })
const texto = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600'], variable: '--fonte-texto' })

export const metadata: Metadata = { title: 'Orçamentos', robots: { index: false, follow: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main>{children}</main>
      </body>
    </html>
  )
}
